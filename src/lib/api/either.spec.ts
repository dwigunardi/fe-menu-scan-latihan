import { describe, it, expect, vi } from 'vitest';
import { left, right } from './either';

describe('Either Monad', () => {
  it('should construct and identify a Left value correctly', () => {
    const errorResult = left('something went wrong');

    expect(errorResult.isLeft()).toBe(true);
    expect(errorResult.isRight()).toBe(false);
    expect(errorResult.value).toBe('something went wrong');
  });

  it('should construct and identify a Right value correctly', () => {
    const successResult = right({ id: 1, name: 'Kopi Kumpul' });

    expect(successResult.isRight()).toBe(true);
    expect(successResult.isLeft()).toBe(false);
    expect(successResult.value).toEqual({ id: 1, name: 'Kopi Kumpul' });
  });

  it('should map Right values without affecting Left values', () => {
    const successResult = right(10);
    const mappedSuccess = successResult.map((n) => n * 2);

    expect(mappedSuccess.isRight()).toBe(true);
    if (mappedSuccess.isRight()) {
      expect(mappedSuccess.value).toBe(20);
    }

    const failResult = left<string, number>('error');
    const mappedFail = failResult.map((n) => n * 2);

    expect(mappedFail.isLeft()).toBe(true);
    if (mappedFail.isLeft()) {
      expect(mappedFail.value).toBe('error');
    }
  });

  it('should map Left values without affecting Right values', () => {
    const failResult = left<string, number>('error');
    const mappedFail = failResult.mapLeft((err) => `Wrapped: ${err}`);

    expect(mappedFail.isLeft()).toBe(true);
    if (mappedFail.isLeft()) {
      expect(mappedFail.value).toBe('Wrapped: error');
    }

    const successResult = right<number, string>(100);
    const mappedSuccess = successResult.mapLeft((err) => `Ignored: ${err}`);
    expect(mappedSuccess.isRight()).toBe(true);
  });

  it('executes tapLeft and tapRight side effects correctly on appropriate branches', () => {
    const leftEffect = vi.fn();
    const rightEffect = vi.fn();

    const leftVal = left('boom');
    leftVal.tapLeft(leftEffect);
    leftVal.tapRight(rightEffect);

    expect(leftEffect).toHaveBeenCalledWith('boom');
    expect(rightEffect).not.toHaveBeenCalled();

    const rightVal = right('yay');
    rightVal.tapLeft(leftEffect);
    rightVal.tapRight(rightEffect);

    expect(rightEffect).toHaveBeenCalledWith('yay');
  });
});
