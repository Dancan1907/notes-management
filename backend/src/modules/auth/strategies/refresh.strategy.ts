import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    super({
      // Extract refresh token from the request body field 'refresh_token'
      jwtFromRequest: ExtractJwt.fromBodyField("refresh_token"),
      // Reject expired tokens
      ignoreExpiration: false,
      // Use the refresh secret for verification
      secretOrKey: process.env.JWT_REFRESH_SECRET! as string,
    });
  }

  // validate() receives the decoded refresh token payload
  async validate(payload: any) {
    // Return user data and also the refresh token itself (we need it to compare with DB)
    // We'll attach both to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken: ExtractJwt.fromBodyField("refresh_token"), // We'll get it in the guard
    };
  }
}
