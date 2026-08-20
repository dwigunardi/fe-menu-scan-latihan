import { CustomFetchOptions } from '../custom-fetch';

export interface PipelineContext<T = unknown> {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  options: CustomFetchOptions;
  sessionKey?: CryptoKey | null;
  rawResponse?: Response;
  responseData?: T;
  startTime?: number;
  durationMs?: number;
}

export type NextFunction = () => Promise<void>;

export type Middleware = (
  ctx: PipelineContext<any>,
  next: NextFunction
) => Promise<void>;
