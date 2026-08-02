import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (
      process.env.MAINTENANCE_MODE === "true" &&
      !req.path.startsWith("/health")
    ) {
      throw new ServiceUnavailableException("Service is under maintenance");
    }
    next();
  }
}
