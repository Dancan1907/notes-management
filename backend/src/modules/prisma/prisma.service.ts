// backend/src/modules/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(
      async (
        params: Prisma.MiddlewareParams,
        next: (params: Prisma.MiddlewareParams) => Promise<unknown>
      ) => {
        if (params.model === 'User' && params.action === 'findMany') {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        return next(params);
      }
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
