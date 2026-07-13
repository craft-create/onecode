import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { ShareService } from './share.service';


@Controller('shares')

export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.shareService.findAll(req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shareService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.shareService.create({ ...data, createdBy: req.user?.userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.shareService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shareService.delete(id);
  }
}
