import { APP_FILTER } from '@nestjs/core';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@server/common/compat/nestjs-common';
import { DataPaasModule } from '@server/common/compat/nestjs-datapaas';
import { LoggerModule } from '@server/common/compat/nestjs-logger';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { HomeModule } from './modules/home/home.module';
import { MaterialModule } from './modules/material/material.module';
import { UserMaterialModule } from './modules/user-material/user-material.module';
import { ScriptModule } from './modules/script/script.module';
import { SearchModule } from './modules/search/search.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { FollowModule } from './modules/follow/follow.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { ViewModule } from './modules/view/view.module';
import { LocalDatabaseModule } from './local-database.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ChatModule } from './modules/chat/chat.module';
import { TeamModule } from './modules/team/team.module';
import { ProjectModule } from './modules/project/project.module';
import { SettingModule } from './modules/setting/setting.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TagModule } from './modules/tag/tag.module';
import { TemplateModule } from './modules/template/template.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RequirementModule } from './modules/requirement/requirement.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { ShareModule } from './modules/share/share.module';
import { FileManagerModule } from './modules/file-manager/file-manager.module';
import { RuntimeModule } from './modules/runtime/runtime.module';

const isDataPaasDisabled =
  process.env.FORCE_FRAMEWORK_DISABLE_DATAPASS === 'true' ||
  !(process.env.SUDA_DATABASE_URL || process.env.DATABASE_URL);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
        }),
    CommonModule,
    LoggerModule,
    ...(isDataPaasDisabled
      ? [LocalDatabaseModule]
      : [
          DataPaasModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              const connectionString =
                configService.get<string>('SUDA_DATABASE_URL') ||
                configService.get<string>('DATABASE_URL');
              if (!connectionString) {
                throw new Error('数据库未配置：请设置 SUDA_DATABASE_URL 或 DATABASE_URL');
              }
              return { connectionString };
            },
          }),
        ]),
    // ====== @route-section: business-modules START ======
    HomeModule,
    MaterialModule,
    UserMaterialModule,
    ScriptModule,
    SearchModule,
    FavoriteModule,
    FollowModule,
    AuthModule,
    UploadModule,
    NotificationModule,
    ChatModule,
    TeamModule,
    ProjectModule,
    SettingModule,
    FileManagerModule,
    AnalyticsModule,
    TagModule,
    TemplateModule,
    PaymentModule,
    RequirementModule,
    AiModule,
    AuditModule,
    ShareModule,
    RuntimeModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
