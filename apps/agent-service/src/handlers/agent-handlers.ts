/**
 * @module @mtp/agent-service/handlers/agent-handlers
 *
 * Agent HTTP → OpenCode AgentPort + OpenCode HTTP 透传。
 */

import { randomUUID } from 'node:crypto';
import type {
  AgentPort,
  CreateInstructionInput,
  Instruction,
  OpenCodeHttpClient,
} from '@mtp/domain-agent';
import { OpenCodeHttpError, probeOpenCode } from '@mtp/domain-agent';
import type {
  AbortAgentRequest,
  AgentHttpHandlers,
  AskLlmRequest,
  DispatchToolsRequest,
  IngestRequest,
  OpenCodeCreateSessionRequest,
  OpenCodePostMessageRequest,
  OpenEpisodeRequest,
  RunInstructionRequest,
} from '../api/agent-http.js';
import { fail, ok, type HttpResult } from '../api/http-kit.js';
import type { PlaygroundRunHub } from '../sse/playground-run-hub.js';

function toInstruction(
  body: Instruction | CreateInstructionInput,
  streamId?: string,
): Instruction {
  if (
    body &&
    typeof body === 'object' &&
    'expectation' in body &&
    body.expectation !== undefined
  ) {
    const metadata = {
      ...(body.metadata ?? {}),
      ...(streamId ? { streamId } : {}),
    };
    return {
      instructionId:
        'instructionId' in body && body.instructionId
          ? body.instructionId
          : randomUUID(),
      expectation: body.expectation,
      preconditions: body.preconditions,
      actions: body.actions,
      hints: body.hints,
      tools: body.tools,
      timeoutMs: body.timeoutMs,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    };
  }
  throw new Error('INVALID_INSTRUCTION: expectation is required');
}

function fromError(error: unknown): HttpResult {
  if (error instanceof OpenCodeHttpError) {
    return fail(error.status >= 400 && error.status < 600 ? error.status : 502, {
      code: 'OPENCODE_HTTP',
      message: error.message,
      status: error.status,
      body: error.body,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('EPISODE_NOT_FOUND')) {
    return fail(404, { code: 'EPISODE_NOT_FOUND', message });
  }
  if (message.startsWith('INVALID_INSTRUCTION')) {
    return fail(400, { code: 'INVALID_INSTRUCTION', message });
  }
  return fail(500, { code: 'INTERNAL', message });
}

export function createAgentHttpHandlers(deps: {
  agent: AgentPort;
  openCode: OpenCodeHttpClient;
  playgroundRuns?: PlaygroundRunHub;
}): AgentHttpHandlers {
  const { agent, openCode, playgroundRuns } = deps;

  return {
    async health() {
      const probe = await probeOpenCode({
        baseUrl: openCode.baseUrl,
        directory: openCode.directory,
      });
      return ok({
        ok: probe.ok,
        service: 'agent-service',
        llmReachable: probe.ok,
        openCodeUrl: openCode.baseUrl,
        openCodeVersion: probe.version,
        message: probe.ok
          ? 'Agent HTTP facade (OpenCode backend)'
          : probe.message ?? 'OpenCode unreachable',
      });
    },

    async runInstruction(body: RunInstructionRequest) {
      try {
        const streamId =
          typeof body?.streamId === 'string' ? body.streamId : undefined;
        const { streamId: _drop, ...rest } = body as RunInstructionRequest & {
          streamId?: string;
        };
        const instruction = toInstruction(rest, streamId);
        return ok(await agent.runInstruction(instruction));
      } catch (error) {
        return fromError(error);
      }
    },

    async openEpisode(body: OpenEpisodeRequest) {
      try {
        const instruction = toInstruction(body);
        return ok(await agent.openEpisode(instruction), 201);
      } catch (error) {
        return fromError(error);
      }
    },

    async getEpisode(id) {
      try {
        return ok(await agent.getEpisode(id));
      } catch (error) {
        return fromError(error);
      }
    },

    async advance(id) {
      try {
        return ok(await agent.advance(id));
      } catch (error) {
        return fromError(error);
      }
    },

    async askLlm(id, body: AskLlmRequest) {
      try {
        if (
          body?.phase !== 'act' &&
          body?.phase !== 'judge'
        ) {
          return fail(400, {
            code: 'INVALID_PHASE',
            message: 'phase must be "act" or "judge"',
          });
        }
        return ok(await agent.askLlm(id, body.phase));
      } catch (error) {
        return fromError(error);
      }
    },

    async dispatchTools(id, body: DispatchToolsRequest) {
      try {
        return ok(await agent.dispatchTools(id, body?.tool_calls));
      } catch (error) {
        return fromError(error);
      }
    },

    async ingest(id, body: IngestRequest) {
      try {
        if (body?.payload === undefined) {
          return fail(400, {
            code: 'INVALID_INGEST',
            message: 'payload is required',
          });
        }
        return ok(await agent.ingest(id, body.payload));
      } catch (error) {
        return fromError(error);
      }
    },

    async closeEpisode(id) {
      try {
        return ok(await agent.closeEpisode(id));
      } catch (error) {
        return fromError(error);
      }
    },

    async abortEpisode(id) {
      try {
        return ok(await agent.abortEpisode(id));
      } catch (error) {
        return fromError(error);
      }
    },

    async abort(body: AbortAgentRequest) {
      try {
        if (body?.episodeId) {
          return ok(await agent.abortEpisode(body.episodeId));
        }
        if (typeof body?.streamId === 'string' && body.streamId.trim()) {
          const episode = await agent.abortByStreamId(body.streamId.trim());
          if (!episode) {
            // pending abort 已登记（Episode 尚未 open）
            return ok({
              ok: true,
              pending: true,
              streamId: body.streamId.trim(),
              status: 'aborted',
            });
          }
          return ok(episode);
        }
        return fail(400, {
          code: 'INVALID_ABORT',
          message: 'Provide episodeId or streamId',
        });
      } catch (error) {
        return fromError(error);
      }
    },

    async openCodeCreateSession(body: OpenCodeCreateSessionRequest) {
      try {
        const session = await openCode.createSession({
          title: body?.title,
          parentID: body?.parentID,
        });
        return ok(session, 201);
      } catch (error) {
        return fromError(error);
      }
    },

    async openCodePostMessage(id, body: OpenCodePostMessageRequest) {
      try {
        const parts =
          body?.parts ??
          (typeof body?.text === 'string'
            ? [{ type: 'text', text: body.text }]
            : undefined);
        if (!parts?.length) {
          return fail(400, {
            code: 'INVALID_MESSAGE',
            message: 'Provide text or parts[]',
          });
        }
        const reply = await openCode.postMessage(id, {
          parts,
          agent: body.agent,
          system: body.system,
          noReply: body.noReply,
          model: body.model,
        });
        return ok(reply);
      } catch (error) {
        return fromError(error);
      }
    },

    async playgroundRunAck(requestId: string) {
      if (!playgroundRuns) {
        return fail(503, { error: 'playground run hub unavailable' });
      }
      const okAck = playgroundRuns.ack(requestId);
      return ok({ ok: okAck, requestId }, okAck ? 200 : 404);
    },

    async playgroundRunResult(requestId, body) {
      if (!playgroundRuns) {
        return fail(503, { error: 'playground run hub unavailable' });
      }
      const okDone = playgroundRuns.complete(requestId, {
        ok: body?.ok === true,
        durationMs: body?.durationMs,
        result: body?.result,
        error: body?.error,
      });
      return ok({ ok: okDone, requestId }, okDone ? 200 : 404);
    },
  };
}
