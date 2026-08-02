import { SetMetadata } from "@nestjs/common";
import { Role } from "@prisma/client";

export const ROLES_KEY = "roles";
// This decorator sets required roles for a route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
