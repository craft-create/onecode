import { Logger, UnauthorizedException } from '@nestjs/common';

export const DRIZZLE_DATABASE = Symbol('DRIZZLE_DATABASE');

export type PostgresJsDatabase = import('drizzle-orm/postgres-js').PostgresJsDatabase;

export class AppLogger extends Logger {
  constructor(context?: string) {
    super(context ?? 'AppLogger');
  }
}

export function NeedLogin(): MethodDecorator {
  return (_target: object, _propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    const original: PropertyDescriptor['value'] = descriptor.value;

    if (typeof original !== 'function') {
      return descriptor;
    }

    descriptor.value = async function (...args: unknown[]) {
      const request: any = args.find((item: unknown) =>
        item && typeof item === 'object' &&
        ('userContext' in (item as Record<string, unknown>) ||
          'cookies' in (item as Record<string, unknown>) ||
          '__localUserId' in (item as Record<string, unknown>)),
      );

      const userId: unknown = request?.userContext?.userId || request?.__localUserId;
      if (!userId) {
        throw new UnauthorizedException('请先登录');
      }

      return original.apply(this, args);
    };

    return descriptor;
  };
}

export async function configureApp(
  app: any,
  _options?: {
    disableSwagger?: boolean;
  },
): Promise<void> {
  void _options;
  app.enableCors({
    origin: true,
    credentials: true,
  });
}
