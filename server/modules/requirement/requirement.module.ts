import { Module } from '@nestjs/common';
import { RequirementService } from './requirement.service';
import { RequirementController } from './requirement.controller';

@Module({
  providers: [RequirementService],
  controllers: [RequirementController],
  exports: [RequirementService],
})
export class RequirementModule {}
