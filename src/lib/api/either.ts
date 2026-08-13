/**
 * Functional Programming Monad: Either<Left, Right>
 * - Left represents failure / error data
 * - Right represents success / valid data
 */

export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  readonly _tag = 'Left' as const;

  constructor(readonly value: L) {}

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  /**
   * Transforms the Left value if present
   */
  mapLeft<T>(fn: (leftVal: L) => T): Either<T, R> {
    return new Left<T, R>(fn(this.value));
  }

  /**
   * Ignores Right transformation on Left
   */
  map<T>(_fn: (rightVal: R) => T): Either<L, T> {
    return new Left<L, T>(this.value);
  }

  /**
   * Executes side-effect on Left
   */
  tapLeft(fn: (leftVal: L) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Ignores Right side-effect on Left
   */
  tapRight(_fn: (rightVal: R) => void): this {
    return this;
  }
}

export class Right<L, R> {
  readonly _tag = 'Right' as const;

  constructor(readonly value: R) {}

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  /**
   * Ignores Left transformation on Right
   */
  mapLeft<T>(_fn: (leftVal: L) => T): Either<T, R> {
    return new Right<T, R>(this.value);
  }

  /**
   * Transforms the Right value if present
   */
  map<T>(fn: (rightVal: R) => T): Either<L, T> {
    return new Right<L, T>(fn(this.value));
  }

  /**
   * Ignores Left side-effect on Right
   */
  tapLeft(_fn: (leftVal: L) => void): this {
    return this;
  }

  /**
   * Executes side-effect on Right
   */
  tapRight(fn: (rightVal: R) => void): this {
    fn(this.value);
    return this;
  }
}

/**
 * Creates a Left (Failure) Either instance
 */
export const left = <L, R = never>(value: L): Either<L, R> => new Left<L, R>(value);

/**
 * Creates a Right (Success) Either instance
 */
export const right = <R, L = never>(value: R): Either<L, R> => new Right<L, R>(value);
