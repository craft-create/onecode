import { Controller, Get, Param } from '@nestjs/common';

@Controller()
export class RuntimeController {
  @Get('spark/b/:appId/get_published')
  getPublishedLegacy(@Param('appId') appId: string) {
    return this.buildPublishedResponse(appId);
  }

  @Get('app/:appId/__runtime__/api/v1/studio/get_published')
  getPublishedNew(@Param('appId') appId: string) {
    return this.buildPublishedResponse(appId);
  }

  @Get('spark/app/:appId/runtime/api/v1/permissions/roles')
  getPermissions(@Param('appId') appId: string) {
    return {
      code: 0,
      status_code: '0',
      appId,
      data: {
        roles: [],
      },
    };
  }

  private buildPublishedResponse(appId: string) {
    return {
      code: 0,
      status_code: '0',
      message: 'ok',
      data: {
        app_id: appId,
        app_info: {
          app_name: '光影工坊',
          app_avatar: '',
          app_description: '影视创作平台',
        },
        app_runtime_extra: {
          bucket: {
            default_bucket_id: 'default',
          },
        },
      },
    };
  }
}
