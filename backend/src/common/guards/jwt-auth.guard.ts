import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
// We'll create a @Public() decorator to bypass auth on some routes
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  // Reflector allows us to read metadata set by decorators
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public using @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // If public, allow access without JWT
      return true;
    }
    // Otherwise, delegate to the default JWT guard logic
    return super.canActivate(context);
  }

  // handleRequest is called after the strategy validates the token
  handleRequest(err: any, user: any, _info: any) {
    // If there's an error or no user, throw Unauthorized
    if (err || !user) {
      throw err || new UnauthorizedException("Invalid or expired token");
    }
    return user;
  }
}
