import { ApiTransportOptions } from '../types';

export interface PipelineContext<T = unknown> {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  options: ApiTransportOptions;
  sessionKey?: CryptoKey | null;
  rawResponse?: Response;
  responseData?: T;
  startTime?: number;
  durationMs?: number;
}

export type NextFunction = () => Promise<void>;

export type Middleware = (
  ctx: PipelineContext<unknown>,
  next: NextFunction
) => Promise<void>;
