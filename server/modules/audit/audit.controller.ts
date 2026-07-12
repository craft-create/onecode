import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.auditService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.auditService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.auditService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.auditService.delete(id);
  }
}
