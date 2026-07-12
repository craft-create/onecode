import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analyticss')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.analyticsService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.analyticsService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.analyticsService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.analyticsService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.analyticsService.delete(id);
  }
}
