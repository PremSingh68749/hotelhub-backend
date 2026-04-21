import { Injectable } from '@nestjs/common';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
}

@Injectable()
export class ConfigService {
  get emailConfig(): EmailConfig {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  }

  get jwtConfig(): JWTConfig {
    return {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    };
  }

  get otpConfig(): OTPConfig {
    return {
      length: parseInt(process.env.OTP_LENGTH || '6'),
      expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3'),
    };
  }

  get databaseConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'booking_db',
    };
  }

  get appConfig() {
    return {
      port: parseInt(process.env.PORT || '3000'),
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

  get emailFromConfig() {
    return {
      name: process.env.EMAIL_FROM_NAME || 'Booking System',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@yourdomain.com',
    };
  }

  get securityConfig() {
    return {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    };
  }

  get rateLimitConfig() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    };
  }

  get cloudinaryConfig() {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
  }
}
