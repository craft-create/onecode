import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import type { SearchResponse } from '@shared/search.interface';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('keyword') keyword: string,
    @Query('type') type?: string,
  ): Promise<SearchResponse> {
    return this.searchService.search({
      keyword: keyword || '',
      type: type || 'all',
    });
  }
}
