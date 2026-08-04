// backend/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/logger.config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmailModule } from './modules/email/email.module';
import emailConfig from './config/email.config';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
// ✅ NEW IMPORT: Notes module for notes management
import { NotesModule } from './modules/notes/notes.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig], // you can add email config here later
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),

        // ✅ Resend Configuration (New - Optional)
        RESEND_API_KEY: Joi.string().optional(),
        EMAIL_FROM: Joi.string().optional().default('onboarding@resend.dev'),
        EMAIL_FROM_NAME: Joi.string().optional().default('Notes App'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),

        // ✅ Make old SMTP fields optional (for backward compatibility)
        EMAIL_HOST: Joi.string().optional(),
        EMAIL_PORT: Joi.number().optional().default(587),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASSWORD: Joi.string().optional(),
        EMAIL_FROM_OLD: Joi.string().optional(),
        EMAIL_FROM_NAME_OLD: Joi.string().optional(),

        CORS_ORIGINS: Joi.string().optional(),
        LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),

        // Redis (Optional)
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        REDIS_DB: Joi.number().optional(),
        REDIS_KEY_PREFIX: Joi.string().optional(),

        // Testing
        TEST_DATABASE_URL: Joi.string().optional(),
      }),
    }),
    // Throttler with in‑memory storage (no Redis)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 60, // 60 requests per minute per IP
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    FilesModule,
    HealthModule,
    // ✅ NEW: Notes module for note management system
    NotesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
