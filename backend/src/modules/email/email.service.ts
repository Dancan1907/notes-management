// backend/src/modules/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Logger } from 'nestjs-pino';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(
    private configService: ConfigService,
    private logger: Logger
  ) {
    // Initialize Resend with API key
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables');
    }
    this.resend = new Resend(apiKey || '');

    const emailConfig = this.configService.get('email');
    this.fromEmail = emailConfig?.from || 'onboarding@resend.dev';
    this.fromName = emailConfig?.fromName || 'Notes App';

    this.logger.log('Email service initialized with Resend');
  }

  /**
   * Send a verification email with a token link
   */
  async sendVerificationEmail(
    to: string,
    name: string | null,
    verificationToken: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome${name ? ', ' + name : ''}!</h1>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" class="button">Verify Email</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome${name ? ', ' + name : ''}!
      Thank you for registering. Please verify your email address by clicking the link below:
      ${verifyUrl}
      This link will expire in 24 hours.
      If you didn't create an account with us, please ignore this email.
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Verify Your Email',
        html,
        text,
      });

      if (error) {
        this.logger.error({ error }, `Failed to send verification email to ${to}`);
        throw new Error(error.message);
      }

      this.logger.log(`Verification email sent to ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error({ error }, `Failed to send verification email to ${to}`);
      throw error;
    }
  }

  /**
   * Send a password reset email with a token link
   */
  async sendPasswordResetEmail(to: string, name: string | null, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .warning { color: #DC2626; font-size: 14px; background: #FEE2E2; padding: 12px; border-radius: 4px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request${name ? ', ' + name : ''}</h1>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <div class="warning">
            <p><strong>⚠️ Did you not request this?</strong></p>
            <p>If you didn't request a password reset, please ignore this email. Your password will not change unless you click the link and set a new one.</p>
          </div>
          <div class="footer">
            <p>If you have any issues, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request${name ? ', ' + name : ''}

      We received a request to reset your password. Click the link below to set a new password:
      ${resetUrl}

      This link will expire in 1 hour.

      ⚠️ Did you not request this?
      If you didn't request a password reset, please ignore this email. Your password will not change unless you click the link and set a new one.

      If you have any issues, please contact support.
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Reset Your Password',
        html,
        text,
      });

      if (error) {
        this.logger.error({ error }, `Failed to send password reset email to ${to}`);
        throw new Error(error.message);
      }

      this.logger.log(`Password reset email sent to ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error({ error }, `Failed to send password reset email to ${to}`);
      throw error;
    }
  }
}
