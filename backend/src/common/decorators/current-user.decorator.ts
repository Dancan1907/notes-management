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
    const user = request.user;

    // If data is provided, return that specific property
    // e.g., @CurrentUser('id') returns user.id
    if (data) {
      return user?.[data];
    }

    // Otherwise return the entire user object
    return user;
  },
);
