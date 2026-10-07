// backend/src/modules/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// ✅ MiddlewareParams is exported directly from Prisma namespace
type MiddlewareParams = Prisma.MiddlewareParams;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // After connecting, add middleware:
    // ✅ Fixed: Use type alias for MiddlewareParams
    this.$use(
      async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<unknown>) => {
        if (params.model === 'User' && params.action === 'findMany') {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        // handle other actions...
        return next(params);
      }
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
