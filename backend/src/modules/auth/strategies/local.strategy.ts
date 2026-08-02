import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // By default, Passport expects 'username' and 'password'
    // We override to use 'email' as the username field
    super({ usernameField: "email" });
  }

  // validate() receives email and password from the request body
  // It calls AuthService.validateUser to verify credentials
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      // If invalid, throw UnauthorizedException (will return 401)
      throw new UnauthorizedException("Invalid credentials");
    }
    return user; // Passport will attach this to request.user
  }
}
