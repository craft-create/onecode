import type { DynamicModule, ModuleMetadata } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { DRIZZLE_DATABASE } from './fullstack-nestjs-core';

interface DataPaasModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory?: (...args: any[]) => Promise<{ connectionString?: string } | string> | { connectionString?: string } | string;
}

@Global()
@Module({})
export class DataPaasModule {
  static forRootAsync(options: DataPaasModuleAsyncOptions = {}): DynamicModule {
    const provider = {
      provide: DRIZZLE_DATABASE,
      useFactory: async (...args: any[]) => {
        const raw = options.useFactory ? await options.useFactory(...args) : {};
        const connectionString = typeof raw === 'string'
          ? raw
          : raw?.connectionString;

        if (!connectionString) {
          throw new Error('数据库未配置：请设置 SUDA_DATABASE_URL 或 DATABASE_URL');
        }

        const client = postgres(connectionString, {
          connect_timeout: 10,
          max: 10,
        });

        return drizzle(client);
      },
      inject: options.inject || [],
    };

    return {
      module: DataPaasModule,
      imports: options.imports || [],
      providers: [provider],
      exports: [provider.provide],
    };
  }
}
