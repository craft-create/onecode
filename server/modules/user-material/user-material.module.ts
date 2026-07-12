import { Module } from '@nestjs/common';
import { UserMaterialController } from './user-material.controller';
import { UserMaterialService } from './user-material.service';

@Module({
  controllers: [UserMaterialController],
  providers: [UserMaterialService],
  exports: [UserMaterialService],
})
export class UserMaterialModule {}
