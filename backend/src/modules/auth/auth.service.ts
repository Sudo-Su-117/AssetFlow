import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../db';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-secret-key-12345';

export class AuthService {
  static async signup(data: { name: string; email: string; password?: string }) {
    const email = data.email.toLowerCase().trim();
    
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Conflict: Email already exists.');
    }

    // Force role to EMPLOYEE (absolute business rule constraint!)
    const role = 'EMPLOYEE';
    const rawPassword = data.password || 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        role,
        password: passwordHash,
        status: 'ACTIVE'
      }
    });

    // Write audit activity log
    await prisma.activityLog.create({
      data: {
        type: 'USER_REGISTERED',
        message: `New account registered for ${user.name} as Employee`,
        userId: user.id
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  static async login(data: { email: string; password?: string }) {
    const email = data.email.toLowerCase().trim();
    const rawPassword = data.password || '';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Unauthorized: Invalid credentials.');
    }

    if (user.status === 'INACTIVE') {
      throw new Error('Forbidden: Account disabled. Please contact an administrator.');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Unauthorized: Invalid credentials.');
    }

    // Generate stateless tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit activity log
    await prisma.activityLog.create({
      data: {
        type: 'USER_LOGIN',
        message: `User logged in: ${user.name}`,
        userId: user.id
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || user.status === 'INACTIVE') {
        throw new Error('Invalid token');
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return { accessToken };
    } catch (err) {
      throw new Error('Unauthorized: Session refresh failed.');
    }
  }

  static async forgotPassword(email: string) {
    const targetEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      // Avoid revealing account presence, but don't perform reset
      return { message: 'If the email exists, a reset link will be sent.' };
    }

    // Simulate reset token generation in log
    await prisma.activityLog.create({
      data: {
        type: 'PASSWORD_RESET_REQUESTED',
        message: `Password reset request generated for ${user.name}`,
        userId: user.id
      }
    });

    return { message: 'If the email exists, a reset link will be sent.' };
  }

  static async resetPassword(data: { email: string; newPassword?: string }) {
    const targetEmail = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      throw new Error('User not found.');
    }

    const rawPassword = data.newPassword || 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash }
    });

    await prisma.activityLog.create({
      data: {
        type: 'PASSWORD_RESET_COMPLETED',
        message: `Password reset successfully for ${user.name}`,
        userId: user.id
      }
    });

    return { success: true };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, departmentId: true }
    });
    if (!user) throw new Error('User not found.');
    return user;
  }
}
