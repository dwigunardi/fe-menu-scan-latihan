import { describe, it, expect } from 'vitest';
import { getJwtSubject } from '@/lib/utils/jwt';

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fakeJwt(claims: object): string {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(claims)}.signature`;
}

describe('getJwtSubject', () => {
  it('reads the sub claim', () => {
    expect(getJwtSubject(fakeJwt({ sub: 'a0b1c2d3-uuid', role: 'CASHIER' }))).toBe('a0b1c2d3-uuid');
  });

  it('returns null for tokens that are not readable JWTs', () => {
    expect(getJwtSubject('opaque-token')).toBeNull();
    expect(getJwtSubject('a.%%%.c')).toBeNull();
    expect(getJwtSubject(fakeJwt({ role: 'CASHIER' }))).toBeNull();
    expect(getJwtSubject(fakeJwt({ sub: 42 }))).toBeNull();
  });
});
