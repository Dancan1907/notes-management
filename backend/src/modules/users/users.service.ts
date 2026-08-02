// backend/src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { UserResponseDto } from "./dto/user-response.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all users (returns UserResponseDto array)
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // The Prisma result matches UserResponseDto shape exactly
    return users as UserResponseDto[];
  }

  /**
   * Find a single user by ID
   * Returns UserResponseDto or throws NotFoundException
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as UserResponseDto;
  }

  /**
   * Update a user (only provided fields)
   * Returns updated UserResponseDto
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists (will throw if not found)
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        // Only include fields that are provided
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated as UserResponseDto;
  }

  /**
   * Change a user's role (convenience method)
   * Returns updated UserResponseDto
   */
  async changeRole(id: string, dto: ChangeRoleDto): Promise<UserResponseDto> {
    return this.update(id, { role: dto.role });
  }

  /**
   * Change a user's password (self-service)
   * Verifies the current password before updating to the new one
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    const isValid = await argon2.verify(user.password, currentPassword);
    if (!isValid)
      throw new UnauthorizedException("Current password is incorrect");
    const hashed = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: "Password updated successfully" };
  }

  /**
   * Delete a user (hard delete)
   */
  async remove(id: string): Promise<void> {
    // Check if user exists (will throw if not found)
    await this.findOne(id);
    // Delete the user
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
