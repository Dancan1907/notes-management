import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class RefreshGuard extends AuthGuard("jwt-refresh") {
  // This guard uses the 'jwt-refresh' strategy defined earlier
  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException("Invalid refresh token");
    }
    // The refresh token itself is not in the user object; we need to extract it from the request body.
    // We'll do that in the controller.
    return user;
  }
}
