import prisma from '../config/prisma';
import { comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { LoginInput } from '../validators/auth.validator';

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface LoginResult {
  user: AuthUserDto;
  token: string;
}

export class AuthService {
  static async login(input: LoginInput): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Prevent email enumeration: return identical generic message if user doesn't exist
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (!user.isActive) {
      const error: any = new Error('Account is deactivated. Please contact an administrator.');
      error.statusCode = 403;
      throw error;
    }

    // Compare bcrypt password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Extract roles
    const roleNames = user.roles.map((ur) => ur.role.name);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
      },
      token,
    };
  }

  static async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error('User not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }
}
