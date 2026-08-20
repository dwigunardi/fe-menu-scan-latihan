import { z } from 'zod';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import { customFetch, CustomFetchOptions } from './custom-fetch';
import { logger } from '@/lib/logger';

/**
 * Hardened API Request:
 * 1. Executes secure transport via Interceptor Pipeline
 * 2. Hardens and validates the response data structure with Zod at runtime
 * 3. Logs contract violations without leaking sensitive details
 * 4. Returns Either<ApiError, z.infer<TSchema>>
 */
export async function hardenedFetch<TSchema extends z.ZodTypeAny>(
  endpoint: string,
  schema: TSchema,
  options: CustomFetchOptions = {}
): Promise<Either<ApiError, z.infer<TSchema>>> {
  // 1. Execute secure fetch
  const rawResult = await customFetch<unknown>(endpoint, options);

  if (rawResult.isLeft()) {
    return left(rawResult.value);
  }

  // 2. Validate response structure with Zod schema
  const parseResult = schema.safeParse(rawResult.value);

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: `${issue.message} (${issue.code})`,
    }));

    logger.error(
      {
        endpoint,
        issues: errorDetails,
      },
      `🚨 [Contract Violation Error] on ${endpoint}`
    );

    return left(ApiError.contractViolation(endpoint, errorDetails));
  }

  // 3. Return 100% type-safe and verified data in Right
  return right(parseResult.data);
}
