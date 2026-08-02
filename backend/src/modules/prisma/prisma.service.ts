import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // After connecting, add middleware:
    this.$use(async (params, next) => {
      if (params.model === "User" && params.action === "findMany") {
        params.args.where = { ...params.args.where, deletedAt: null };
      }
      // handle other actions...
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
