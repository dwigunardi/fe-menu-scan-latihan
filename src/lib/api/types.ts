/**
 * Universal options for apiTransport and pipelineRunner.
 */
export interface ApiTransportOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipEncryption?: boolean;
  skipHandshakeToken?: boolean;
  retryOnHandshakeExpired?: boolean;
  retryOnTokenExpired?: boolean;
}

/**
 * Backward compatibility alias during migration.
 */
export type CustomFetchOptions = ApiTransportOptions;
