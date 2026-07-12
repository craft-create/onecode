import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ais')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.aiService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.aiService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.aiService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.aiService.delete(id);
  }
}
