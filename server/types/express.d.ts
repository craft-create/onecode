import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    userContext?: {
      userId?: string;
      userName?: string;
      [key: string]: unknown;
    };
    __localUserId?: string;
    __platform_data__?: Record<string, unknown>;
  }
}
