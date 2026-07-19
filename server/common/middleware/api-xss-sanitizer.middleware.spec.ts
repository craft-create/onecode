import { BadRequestException } from '@nestjs/common';
import { ApiXssSanitizerMiddleware } from './api-xss-sanitizer.middleware';
import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

type MockResponse = Response & {
  statusCode?: number;
};

function createRequest(
  overrides: {
    path?: string;
    originalUrl?: string;
    body?: unknown;
    query?: unknown;
    params?: unknown;
  } = {},
): Request {
  const { path = '/api/test', originalUrl = path, body, query, params } = overrides;

  return {
    path,
    originalUrl,
    body,
    query,
    params,
    headers: {},
  } as unknown as Request;
}

function createResponse(): MockResponse {
  return ({
    statusCode: undefined,
  } as MockResponse);
}

describe('ApiXssSanitizerMiddleware', () => {
  it('rejects xss in protected callback field', () => {
    const middleware = new ApiXssSanitizerMiddleware();
    const req = createRequest({
      query: {
        callback: 'javascript:alert(1)',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    expect(() => {
      middleware.use(req, res, next);
    }).toThrow(BadRequestException);
    expect(next).not.toHaveBeenCalled();
  });

  it('ignores high-risk patterns in unprotected fields', () => {
    const middleware = new ApiXssSanitizerMiddleware();
    const req = createRequest({
      body: {
        comment: '<script>alert(1)</script>',
        title: 'safe',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    expect(() => {
      middleware.use(req, res, next);
    }).not.toThrow();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('detects nested suspicious content in protected arrays', () => {
    const middleware = new ApiXssSanitizerMiddleware();
    const payload = {
      redirect: ['safe', 'ok', 'javascript:alert(1)'],
    };
    const req = createRequest({
      body: payload,
    });
    const res = createResponse();
    const next = jest.fn();

    expect(() => {
      middleware.use(req, res, next);
    }).toThrow(BadRequestException);
    expect(next).not.toHaveBeenCalled();
    expect(payload.redirect[1]).toBe('ok');
    expect(payload.redirect[2]).toBe('javascript:alert(1)');
  });

  it('skips non-api paths', () => {
    const middleware = new ApiXssSanitizerMiddleware();
    const req = createRequest({
      path: '/health',
      query: {
        callback: 'javascript:alert(1)',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    expect(() => {
      middleware.use(req, res, next);
    }).not.toThrow();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
