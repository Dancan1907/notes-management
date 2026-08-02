// backend/src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // All endpoints in this controller require ADMIN role
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  // Override class-level guards: any authenticated user can fetch their own
  // profile, not just admins. Must stay above the ":id" route below, or
  // Nest will treat "me" as a dynamic :id param.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.usersService.findOne(user.userId);
  }

  @Post("change-password")
  // Override class-level guards: any authenticated user can change their
  // own password, not just admins.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Change user password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        currentPassword: { type: "string" },
        newPassword: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 401, description: "Invalid current password" })
  async changePassword(
    @Req() req: Request,
    @Body("currentPassword") currentPassword: string,
    @Body("newPassword") newPassword: string,
  ) {
    const user = req.user as { userId: string };
    return this.usersService.changePassword(
      user.userId,
      currentPassword,
      newPassword,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of all users",
    type: [UserResponseDto],
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user by ID (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User found",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User updated",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(":id/role")
  @ApiOperation({ summary: "Change user role (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Role changed",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto) {
    return this.usersService.changeRole(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  @ApiOperation({ summary: "Delete a user (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 204, description: "User deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(@Param("id") id: string) {
    await this.usersService.remove(id);
  }
}
