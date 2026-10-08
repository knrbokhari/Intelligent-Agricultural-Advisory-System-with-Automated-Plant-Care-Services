import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const OTP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const isUser = await this.prisma.user.findUnique({ where: { email } });

    if (isUser && isUser.is_verify)
      throw new ConflictException('Email is already registered');

    const otp = this.generateOtp();
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const codeExpires = this.expiryDate();

    if (isUser && !isUser.is_verify) {
      await this.prisma.user.update({
        where: { id: isUser.id },
        data: {
          name: dto.name,
          password: hashedPassword,
          verificationCode: otp,
          verificationCodeExpiresAt: codeExpires,
        },
      });
      await this.emailService.sendOtp(email, dto.name, otp);
      return {
        message:
          'A new verification code has been sent. Check your email for the code.',
        user: this.publicUser(isUser),
      };
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        password: hashedPassword,
        verificationCode: otp,
        verificationCodeExpiresAt: codeExpires,
      },
    });
    await this.emailService.sendOtp(email, dto.name, otp);
    return {
      message:
        'Registration successful. Check your email for the verification code.',
      user: this.publicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password)))
      throw new UnauthorizedException('Invalid email or password');
    if (!user.is_verify)
      throw new UnauthorizedException('Please verify your email first');
    return {
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: this.publicUser(user),
    };
  }

  async verifyEmail(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (
      !user ||
      user.verificationCode !== dto.otp ||
      !this.isValidCode(user.verificationCodeExpiresAt)
    )
      throw new BadRequestException('Invalid or expired verification code');
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_verify: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });
    return {
      message: 'Email verified successfully',
      user: this.publicUser(updated),
    };
  }

  async resendVerificationOtp(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_verify)
      throw new BadRequestException('Email is already verified');
    const otp = this.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otp,
        verificationCodeExpiresAt: this.expiryDate(),
      },
    });
    const name = user?.name || '';
    await this.emailService.sendVerifyEmail(user.email, name, otp);
    return { message: 'A new verification code has been sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (user) {
      const otp = this.generateOtp();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetCode: otp,
          passwordResetCodeExpiresAt: this.expiryDate(),
        },
      });
      const name = user?.name || '';

      await this.emailService.sendForgotPassword(user.email, name, otp);
    }
    return {
      message: 'If that email exists, a password reset code has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (
      !user ||
      user.passwordResetCode !== dto.otp ||
      !this.isValidCode(user.passwordResetCodeExpiresAt)
    )
      throw new BadRequestException('Invalid or expired password reset code');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 12),
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null,
      },
    });
    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.findUser(userId);
    if (!(await bcrypt.compare(dto.currentPassword, user.password)))
      throw new UnauthorizedException('Current password is incorrect');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.newPassword, 12) },
    });
    return { message: 'Password changed successfully' };
  }

  async me(userId: number) {
    return this.publicUser(await this.findUser(userId));
  }

  private async findUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private expiryDate() {
    return new Date(Date.now() + OTP_TTL_MS);
  }

  private isValidCode(expiresAt: Date | null) {
    return Boolean(expiresAt && expiresAt.getTime() > Date.now());
  }

  private publicUser(user: {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    is_verify: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isVerified: user.is_verify,
    };
  }
}
