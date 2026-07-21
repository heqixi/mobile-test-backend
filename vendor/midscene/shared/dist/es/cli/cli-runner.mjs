import { existsSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import { TOOL_BEHAVIOR_FLAGS, stripBehaviorFlags } from "../agent-tools/tool-defaults.mjs";
import { getDebug } from "../logger.mjs";
import { canonicalizeCliArgKeys, formatCliValidationError, getCliOptionDisplay, parseCliArgs, parseValue } from "./cli-args.mjs";
import { CLIError, reportCLIError } from "./cli-error.mjs";
import { writeCliScreenshotFile } from "./screenshot-file.mjs";
import { cliVerboseErrorMessage, cliVerboseFlag, compactCliVerboseArgs, emitCliVerboseEvent, stripVerboseFlag, withCliVerboseContext } from "./verbose.mjs";
const debug = getDebug('cli-runner');
function outputContentItem(item, isError) {
    switch(item.type){
        case 'text':
            if (isError) console.error(item.text);
            else console.log(item.text);
            break;
        case 'image':
            {
                const filepath = writeCliScreenshotFile(item.data, {
                    mimeType: item.mimeType,
                    filenamePrefix: 'screenshot'
                });
                console.log(`Screenshot saved: ${filepath}`);
                emitCliVerboseEvent({
                    event: 'artifact',
                    kind: 'screenshot',
                    path: filepath,
                    mimeType: item.mimeType
                });
                break;
            }
        default:
            console.log(`[${item.type} content not displayed in CLI]`);
    }
}
function outputResult(result) {
    for (const item of result.content)outputContentItem(item, result.isError ?? false);
}
function removePrefix(name, prefix) {
    if (prefix && name.startsWith(prefix)) return name.slice(prefix.length);
    return name;
}
function printCommandHelp(scriptName, cmd) {
    const { def } = cmd;
    console.log(`\nUsage: ${scriptName} ${cmd.name} [options]\n`);
    console.log(def.description);
    const schemaEntries = Object.entries(def.schema);
    if (schemaEntries.length > 0) {
        const optionWidth = Math.max(22, ...schemaEntries.map(([key])=>getCliOptionDisplay(key, def.cli?.options?.[key]).label.length));
        console.log('\nOptions:');
        for (const [key, zodType] of schemaEntries){
            const { label, aliases } = getCliOptionDisplay(key, def.cli?.options?.[key]);
            const desc = zodType.description ?? '';
            const aliasText = aliases.length > 0 ? ` (aliases: ${aliases.join(', ')})` : '';
            console.log(`  ${label.padEnd(optionWidth)} ${desc}${aliasText}`);
        }
    }
    printGlobalOptions();
}
function printVersion(scriptName, version) {
    console.log(`${scriptName} v${version}`);
}
function printHelp(scriptName, commands, version) {
    if (version) {
        printVersion(scriptName, version);
        console.log('');
    }
    console.log(`\nUsage: ${scriptName} <command> [options]\n`);
    console.log('Commands:');
    for (const { name, def } of commands.filter((command)=>!command.hidden))console.log(`  ${name.padEnd(30)} ${def.description}`);
    console.log(`  ${'version'.padEnd(30)} Show CLI version`);
    printGlobalOptions();
    console.log(`\nRun "${scriptName} <command> --help" for more info.`);
}
function printGlobalOptions() {
    const options = [
        {
            flag: `--${cliVerboseFlag}`,
            description: 'Print progress while the command is running. act prints readable progress by default. Use --verbose=jsonl for structured events.'
        },
        ...TOOL_BEHAVIOR_FLAGS.map((flag)=>({
                flag: `--${flag.cli}`,
                description: flag.description
            }))
    ];
    const optionWidth = Math.max(...options.map((option)=>option.flag.length));
    console.log('\nGlobal Options:');
    for (const option of options)console.log(`  ${option.flag.padEnd(optionWidth)} ${option.description}`);
}
async function runToolsCLI(tools, scriptName, options) {
    const inputArgs = options?.argv ?? process.argv.slice(2);
    debug('CLI invoked: %s %s', scriptName, inputArgs.join(' '));
    const { rawArgs: argsWithoutVerbose, verbose, format: verboseFormat } = stripVerboseFlag(inputArgs);
    const { rawArgs, toolDefaults } = stripBehaviorFlags(argsWithoutVerbose);
    if (Object.keys(toolDefaults).length > 0) tools.setToolDefaults?.(toolDefaults);
    const envFile = join(process.cwd(), '.env');
    if (existsSync(envFile)) dotenv.config({
        path: envFile
    });
    await tools.initTools();
    const commands = tools.getToolDefinitions().map((def)=>({
            name: removePrefix(def.name, options?.stripPrefix).toLowerCase(),
            def
        }));
    if (options?.extraCommands?.length) commands.push(...options.extraCommands.flatMap((cmd)=>[
            {
                name: cmd.name.toLowerCase(),
                def: cmd.def,
                hidden: cmd.hidden
            },
            ...(cmd.aliases ?? []).map((alias)=>({
                    name: alias.toLowerCase(),
                    def: cmd.def,
                    hidden: true
                }))
        ]));
    const cliVersion = options?.version;
    const [commandName, ...restArgs] = rawArgs;
    if (!commandName || '--help' === commandName || '-h' === commandName) {
        debug('showing help (no command or --help flag)');
        printHelp(scriptName, commands, cliVersion);
        return;
    }
    if ('--version' === commandName || '-v' === commandName || 'version' === commandName.toLowerCase()) {
        if (!cliVersion) throw new CLIError('Failed to determine CLI version');
        printVersion(scriptName, cliVersion);
        return;
    }
    const match = commands.find((c)=>c.name.toLowerCase() === commandName.toLowerCase());
    if (!match) {
        debug('unknown command: %s', commandName);
        console.error(`Unknown command: ${commandName}`);
        printHelp(scriptName, commands, cliVersion);
        throw new CLIError(`Unknown command: ${commandName}`);
    }
    const parsedArgs = parseCliArgs(restArgs);
    if (true === parsedArgs.help) {
        debug('showing command help for: %s', match.name);
        printCommandHelp(scriptName, match);
        return;
    }
    const cliValidationError = formatCliValidationError(scriptName, match.name, match.def, parsedArgs);
    if (cliValidationError) throw new CLIError(cliValidationError);
    const handlerArgs = canonicalizeCliArgKeys(scriptName, match.name, match.def, parsedArgs);
    debug('command: %s, args: %s', match.name, JSON.stringify(handlerArgs));
    const verboseEnabled = verbose || 'act' === match.name;
    await withCliVerboseContext({
        enabled: verboseEnabled,
        format: verboseFormat,
        scriptName,
        commandName: match.name,
        startedAt: Date.now()
    }, async ()=>{
        const startedAt = Date.now();
        emitCliVerboseEvent({
            event: 'command_start',
            args: compactCliVerboseArgs(handlerArgs)
        });
        try {
            const result = await match.def.handler(handlerArgs);
            debug('command %s completed, isError: %s', match.name, result.isError ?? false);
            outputResult(result);
            emitCliVerboseEvent({
                event: 'command_done',
                status: result.isError ? 'error' : 'ok',
                durationMs: Date.now() - startedAt
            });
            if (result.isError) throw new CLIError('Command failed', 1);
        } catch (error) {
            if (!(error instanceof CLIError && 'Command failed' === error.message)) emitCliVerboseEvent({
                event: 'command_done',
                status: 'error',
                durationMs: Date.now() - startedAt,
                error: cliVerboseErrorMessage(error)
            });
            throw error;
        } finally{
            await tools.destroy();
        }
    });
}
export { CLIError, parseCliArgs, parseValue, removePrefix, reportCLIError, runToolsCLI };
