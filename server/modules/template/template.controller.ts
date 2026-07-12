import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.templateService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.templateService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.templateService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templateService.delete(id);
  }
}
