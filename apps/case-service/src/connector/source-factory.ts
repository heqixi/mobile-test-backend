/**
 * @module @mtp/case-service/connector/source-factory
 *
 * connect({ baseUrl }) → RemoteCaseDataSource（不内嵌业务 Adapter）。
 */

import {
  createRemoteCaseDataSource,
  type CaseDataSourcePort,
} from '@mtp/domain-case';
import type { ConnectorConnectRequest } from '../api/case-http.js';

export const DEFAULT_LIBRARY_BASE_URL =
  process.env.CASE_LIBRARY_URL?.trim() ||
  process.env.COWORK_LIBRARY_URL?.trim() ||
  'http://127.0.0.1:4103';

export interface ConnectorSourceFactory {
  create(req: ConnectorConnectRequest): CaseDataSourcePort;
}

export function createConnectorSourceFactory(): ConnectorSourceFactory {
  return {
    create(req) {
      const baseUrl = (req.baseUrl ?? DEFAULT_LIBRARY_BASE_URL).replace(
        /\/$/,
        '',
      );
      if (!/^https?:\/\//i.test(baseUrl)) {
        throw new Error(`Invalid library baseUrl: ${baseUrl}`);
      }
      return createRemoteCaseDataSource({ baseUrl });
    },
  };
}
