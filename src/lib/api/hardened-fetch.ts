import { z } from 'zod';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import { customFetch, CustomFetchOptions } from './custom-fetch';

/**
 * Hardened API Request:
 * 1. Executes encrypted transport via customFetch
 * 2. Hardens and validates the response data structure with Zod at runtime
 * 3. Returns Either<ApiError, z.infer<TSchema>>
 */
export async function hardenedFetch<TSchema extends z.ZodTypeAny>(
  endpoint: string,
  schema: TSchema,
  options: CustomFetchOptions = {}
): Promise<Either<ApiError, z.infer<TSchema>>> {
  // 1. Execute encrypted fetch
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

    console.error(`🚨 [Contract Violation Error] on ${endpoint}:`, errorDetails);

    return left(ApiError.contractViolation(endpoint, errorDetails));
  }

  // 3. Return 100% type-safe and verified data in Right
  return right(parseResult.data);
}
