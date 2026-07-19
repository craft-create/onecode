import { Controller, Get, Post, Query, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AnalyticsTrackRequest } from '@shared/types';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.analyticsService.getDashboard(req.user?.userId);
  }

  @Get('content/:type/:id')
  getContentStats(
    @Param('type') type: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('days') days?: string,
  ) {
    const dayRange = days ? Number(days) : 30;
    return this.analyticsService.getContentStats(
      type,
      id,
      Number.isFinite(dayRange) ? Math.max(1, Math.floor(dayRange)) : 30,
    );
  }

  @Post('track')
  track(@Body() body: AnalyticsTrackRequest, @Req() req: any) {
    return this.analyticsService.track(body, req.user?.userId, req.ip, req.headers['user-agent']);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.analyticsService.findAll(req.user?.userId);
  }
}
