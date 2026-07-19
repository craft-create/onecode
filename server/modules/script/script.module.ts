import { Module } from '@nestjs/common';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [ScriptController],
  providers: [ScriptService],
})
export class ScriptModule {}
