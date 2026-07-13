import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { TagService } from './tag.service';


@Controller('tags')

export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.tagService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.tagService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tagService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tagService.delete(id);
  }
}
