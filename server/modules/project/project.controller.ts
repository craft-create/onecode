import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.projectService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.projectService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.projectService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectService.delete(id);
  }
}
