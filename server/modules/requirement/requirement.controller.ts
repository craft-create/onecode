import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RequirementService } from './requirement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/requirements')
@UseGuards(JwtAuthGuard)
export class RequirementController {
  constructor(private readonly requirementService: RequirementService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.requirementService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requirementService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.requirementService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.requirementService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.requirementService.delete(id);
  }
}
