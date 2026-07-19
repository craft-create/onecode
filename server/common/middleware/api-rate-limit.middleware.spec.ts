import { ApiRateLimitMiddleware } from './api-rate-limit.middleware';
import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

type MockResponse = {
  statusCode?: number;
  headers: Record<string, string | number>;
};

function createRequest(
  overrides: {
    ip?: string;
    method?: 'GET' | 'POST';
    path?: string;
    originalUrl?: string;
    headers?: Record<string, string | string[] | undefined>;
  } = {},
): Request {
  const { ip = '203.0.113.10', method = 'GET', path = '/api/test', originalUrl = path } = overrides;

  return {
    ip,
    method,
    path,
    originalUrl,
    headers: overrides.headers ?? {
      'x-forwarded-for': '198.51.100.1',
    },
    socket: {
      remoteAddress: '198.51.100.20',
    },
    body: undefined,
    query: undefined,
    params: undefined,
  } as unknown as Request;
}

function createResponse(): MockResponse {
  const headers: Record<string, string | number> = {};
  const response: {
    statusCode: number;
    headers: Record<string, string | number>;
    setHeader: (name: string, value: string | number | readonly string[]) => MockResponse;
    status: (statusCode: number) => MockResponse;
    json: (_body?: unknown) => MockResponse;
  } = {
    statusCode: 200,
    headers,
    setHeader: (name, value) => {
      headers[name] = value as string | number;
      return response as MockResponse;
    },
    status: (statusCode) => {
      response.statusCode = statusCode;
      return response as MockResponse;
    },
    json: () => response,
  };

  return response as MockResponse;
}

describe('ApiRateLimitMiddleware', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses req.ip as primary identifier and ignores x-forwarded-for spoofing by default', () => {
    process.env.API_RATE_LIMIT_WINDOW_MS = '1000';
    process.env.API_RATE_LIMIT_MAX_REQUESTS = '1';
    process.env.API_RATE_LIMIT_TRUST_PROXY_HEADERS = 'false';

    const middleware = new ApiRateLimitMiddleware();
    const req1 = createRequest({
      ip: '203.0.113.10',
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });
    const req2 = createRequest({
      ip: '203.0.113.10',
      headers: { 'x-forwarded-for': '203.0.113.20' },
    });
    const res1 = createResponse();
    const res2 = createResponse();
    const next1 = jest.fn();
    const next2 = jest.fn();

    middleware.use(req1, res1 as unknown as Response, next1);
    middleware.use(req2, res2 as unknown as Response, next2);

    expect(next1).toHaveBeenCalledTimes(1);
    expect(next2).toHaveBeenCalledTimes(0);
    expect(res2.statusCode).toBe(429);
    expect((res2.headers['X-RateLimit-Remaining'] as number)).toBeGreaterThanOrEqual(0);
  });

  it('uses socket ip if req.ip is unavailable and proxy trust disabled', () => {
    process.env.API_RATE_LIMIT_WINDOW_MS = '1000';
    process.env.API_RATE_LIMIT_MAX_REQUESTS = '1';
    process.env.API_RATE_LIMIT_TRUST_PROXY_HEADERS = 'false';

    const middleware = new ApiRateLimitMiddleware();
    const req1 = createRequest({
      ip: '',
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });
    const req2 = createRequest({
      ip: '',
      headers: { 'x-forwarded-for': '198.51.100.2' },
    });
    const res1 = createResponse();
    const res2 = createResponse();
    const next1 = jest.fn();
    const next2 = jest.fn();

    middleware.use(req1, res1 as unknown as Response, next1);
    middleware.use(req2, res2 as unknown as Response, next2);

    expect(next1).toHaveBeenCalledTimes(1);
    expect(next2).toHaveBeenCalledTimes(0);
    expect(res2.statusCode).toBe(429);
  });
});
