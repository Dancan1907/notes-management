import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// This decorator extracts the user from the request object
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // request.user is set by the JwtAuthGuard
    const user = request.user;
    // If data is provided (e.g., @GetUser('email')), return that field
    return data ? user?.[data] : user;
  },
);
