import { Module } from '@nestjs/common';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {}
