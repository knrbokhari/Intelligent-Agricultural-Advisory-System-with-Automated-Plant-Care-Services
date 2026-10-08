/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { emailTemplates } from './templates/email.templates';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor() {
    this.from = `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`;

    const transportOptions: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL as string,
        pass: process.env.SMTP_PASSWORD as string,
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendVerifyEmail(to: string, name: string, code: string): Promise<void> {
    const { subject, html } = emailTemplates.verifyEmail(name, code);
    await this.send(to, subject, html);
  }

  async sendOtp(to: string, name: string, otp: string): Promise<void> {
    const { subject, html } = emailTemplates.resendOtp(name, otp);
    await this.send(to, subject, html);
  }

  async sendForgotPassword(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const { subject, html } = emailTemplates.forgotPassword(name, code);
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.transporter) {
        this.logger.warn(`SMTP is not configured`);
        return;
      }

      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
