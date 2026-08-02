// backend/src/common/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

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

    // ✅ FIX: Check if user exists on request
    if (!request.user) {
      // If no user, return undefined (will be caught by guards)
      return data ? undefined : undefined;
    }

    // If data is provided, return that specific property
    // e.g., @CurrentUser('id') returns user.id
    if (data) {
      // ✅ FIX: Handle nested properties (e.g., user.id, user.sub)
      // JWT typically stores user ID in 'sub' or 'id'
      const user = request.user;

      // Try to get the property directly
      if (user[data] !== undefined) {
        return user[data];
      }

      // If property not found, check if it's in 'sub' (common JWT pattern)
      if (data === "id" && user.sub !== undefined) {
        return user.sub;
      }

      // If property not found, check if it's a nested property
      // e.g., user.id, user.userId
      if (data === "id") {
        return user.id || user.sub || user.userId;
      }

      return user[data];
    }

    // Otherwise return the entire user object
    return request.user;
  },
);
