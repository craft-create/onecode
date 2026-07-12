import { Global, Module } from '@nestjs/common';
import { AppLogger } from './fullstack-nestjs-core';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
