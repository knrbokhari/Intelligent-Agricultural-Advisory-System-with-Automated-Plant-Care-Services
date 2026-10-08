import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-this-development-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
})
export class AuthModule {}
