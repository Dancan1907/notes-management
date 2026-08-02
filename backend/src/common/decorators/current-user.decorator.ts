// backend/src/common/decorators/current-user.decorator.ts

import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Custom decorator to extract the authenticated user from the request
 *
 * This decorator leverages the JWT authentication guard which attaches
 * the user payload to the request object. It provides type-safety and
 * clean code by avoiding manual req.user extraction.
 *
 * Usage:
 * @CurrentUser() user: UserPayload
 * @CurrentUser('id') userId: string // Get specific property
 *
 * @param data - Optional property name to extract from user object
 * @param ctx - Execution context (automatically provided by NestJS)
 * @returns The user object or specific user property
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // ✅ Check if user exists on request
    if (!request.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    const user = request.user;

    // If data is provided, return that specific property
    if (data) {
      // ✅ Try multiple possible field names
      // Priority: exact match > id > userId > sub
      if (user[data] !== undefined) {
        return user[data];
      }

      // If looking for 'id', try common alternatives
      if (data === "id") {
        return user.id || user.userId || user.sub;
      }

      // For other fields, try common alternatives
      return user[data] || user[data.toLowerCase()] || user[data.toUpperCase()];
    }

    // Otherwise return the entire user object
    return user;
  },
);
