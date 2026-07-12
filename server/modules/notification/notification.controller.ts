import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ParseUUIDPipe, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any, @Query('type') type?: string, @Query('isRead') isRead?: string) {
    return this.notificationService.findAll(req.user?.userId, {
      type,
      isRead: isRead === undefined ? undefined : Number(isRead),
    });
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user?.userId).then(count => ({ count }));
  }

  @Get('statistics')
  getStatistics(@Req() req: any) {
    return this.notificationService.getStatistics(req.user?.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any, @Query('type') type?: string) {
    return this.notificationService.markAllAsRead(req.user?.userId, { type });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notificationService.markAsRead(req.user?.userId, id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.notificationService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.notificationService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }
}
