import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // PassportStrategy calls super with configuration
    super({
      // Extract JWT from the Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret key for verifying the token
      secretOrKey: process.env.JWT_SECRET! as string,
    });
  }

  // validate() is called after the token is verified
  // The 'payload' is the decoded JWT payload (sub, email, role, etc.)
  async validate(payload: any) {
    // Return the user data to be attached to request.user
    // This will be available in controllers via @GetUser() or request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
