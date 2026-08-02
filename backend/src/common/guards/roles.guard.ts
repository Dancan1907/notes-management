import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the route metadata (set by @Roles())
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // If no roles required, allow access
    if (!requiredRoles) {
      return true;
    }
    // Get the user from the request (populated by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    // Check if the user's role is in the required roles list
    return requiredRoles.some((role) => user?.role === role);
  }
}
