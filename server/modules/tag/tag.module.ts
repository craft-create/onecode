import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';

@Module({
  providers: [TagService],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}
