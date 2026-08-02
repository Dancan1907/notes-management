// backend/src/modules/health/health.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @Public() // No authentication required
  @ApiOperation({ summary: "Health check endpoint" })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
