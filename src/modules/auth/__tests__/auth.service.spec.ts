import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { User } from '../../../database/models/user.model';
import { OTPService } from '../otp.service';
import { EmailService } from '../../../common/email/email.service';
import { SignupInput, LoginInput, VerifyOTPInput, ResendOTPInput, ForgotPasswordInput, VerifyForgotPasswordOTPInput, ResetPasswordInput } from '../dto/auth.input';
import { GraphQLError } from 'graphql';
import { UserType } from '../../../database/models/user.model';
import { PasswordUtil } from '../../../common/utils/password.util';
import { EmailTemplateType } from '../../../common/email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockOtpService: jest.Mocked<OTPService>;
  let mockEmailService: jest.Mocked<EmailService>;

  const mockUser: any = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    userType: UserType.NORMAL_USER,
    isActive: true,
    isEmailVerified: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: new Date(),
  };

  beforeEach(async () => {
    // Mock PasswordUtil static methods
    jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashedPassword');
    jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);
    jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
      isValid: true,
      message: 'Password meets strength requirements'
    });

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
      verifyAsync: jest.fn().mockResolvedValue({ userId: 1, email: 'test@example.com' }),
      decode: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
    } as any;

    mockUserService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([mockUser]),
      markEmailAsVerified: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(mockUser),
    } as any;

    mockOtpService = {
      generateOTP: jest.fn().mockResolvedValue('123456'),
      verifyOTP: jest.fn().mockResolvedValue({ success: true, message: 'OTP verified' }),
      checkOTPStatus: jest.fn().mockResolvedValue({ hasActiveOTP: false }),
    } as any;

    mockEmailService = {
      sendEmailTemplate: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: OTPService,
          useValue: mockOtpService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('signup', () => {
    it('should signup new user successfully', async () => {
      const signupInput: SignupInput = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'CUSTOMER' as UserType,
      };

      const result = await service.signup(signupInput);

      expect(result).toEqual({
        success: false,
        message: 'Account created successfully! Please check your email for verification OTP to complete registration.'
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: expect.any(String),
        userType: 'CUSTOMER',
      });
      expect(mockOtpService.generateOTP).toHaveBeenCalledWith('test@example.com', 'EMAIL_VERIFICATION', 1);
      expect(mockEmailService.sendEmailTemplate).toHaveBeenCalled();
    });

    it('should return OTP for existing user', async () => {
      const signupInput: SignupInput = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'CUSTOMER' as UserType,
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.signup(signupInput);

      expect(result).toEqual({
        success: false,
        message: 'User already exists. OTP sent to your email for verification.'
      });
      expect(mockOtpService.generateOTP).toHaveBeenCalledWith('test@example.com', 'EMAIL_VERIFICATION', 1);
    });

    it('should throw error when name is empty', async () => {
      const signupInput = {
        name: '',
        email: 'test@example.com',
        password: 'password123',
        userType: UserType.NORMAL_USER,
      };

      await expect(service.signup(signupInput)).rejects.toThrow(GraphQLError);
      await expect(service.signup(signupInput)).rejects.toThrow('Name is required');
    });

    it('should throw error when email is empty', async () => {
      const signupInput = {
        name: 'Test User',
        email: '',
        password: 'password123',
        userType: UserType.NORMAL_USER,
      };

      await expect(service.signup(signupInput)).rejects.toThrow('Email is required');
    });

    it('should throw error when password is too short', async () => {
      const signupInput = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        userType: UserType.NORMAL_USER,
      };

      await expect(service.signup(signupInput)).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should handle service errors', async () => {
      const signupInput: SignupInput = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'CUSTOMER' as UserType,
      };

      mockUserService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.signup(signupInput)).rejects.toThrow('Failed to signup');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login(loginInput);

      expect(result).toEqual({
        success: true,
        token: 'mock-token',
        user: mockUser,
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
        { expiresIn: '7d' }
      );
    });

    it('should return user not found', async () => {
      const loginInput: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.login(loginInput);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });

    it('should return OTP required when active OTP exists', async () => {
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.checkOTPStatus.mockResolvedValue({ hasActiveOTP: true });

      const result = await service.login(loginInput);

      expect(result).toEqual({
        success: false,
        message: 'OTP verification required',
        requiresOTP: true,
      });
    });

    it('should throw error when email is empty', async () => {
      const loginInput = {
        email: '',
        password: 'password123',
      };

      await expect(service.login(loginInput)).rejects.toThrow('Email is required');
    });

    it('should throw error when password is empty', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: '',
      };

      await expect(service.login(loginInput)).rejects.toThrow('Password is required');
    });

    it('should handle service errors', async () => {
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.login(loginInput)).rejects.toThrow('Failed to login');
    });
  });

  describe('resendOTP', () => {
    it('should resend OTP successfully', async () => {
      const resendOTPInput: ResendOTPInput = {
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.resendOTP(resendOTPInput);

      expect(result).toEqual({
        success: true,
        message: 'OTP sent to your email',
      });
      expect(mockOtpService.generateOTP).toHaveBeenCalledWith('test@example.com', 'EMAIL_VERIFICATION', 1);
      expect(mockEmailService.sendEmailTemplate).toHaveBeenCalled();
    });

    it('should return user not found', async () => {
      const resendOTPInput: ResendOTPInput = {
        email: 'nonexistent@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.resendOTP(resendOTPInput);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });

    it('should throw error when email is empty', async () => {
      const resendOTPInput = {
        email: '',
      };

      await expect(service.resendOTP(resendOTPInput)).rejects.toThrow('Email is required');
    });

    it('should handle service errors', async () => {
      const resendOTPInput: ResendOTPInput = {
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.generateOTP.mockRejectedValue(new Error('OTP service error'));

      await expect(service.resendOTP(resendOTPInput)).rejects.toThrow('Failed to resend OTP');
    });
  });

  describe('completeOTPVerification', () => {
    it('should complete OTP verification successfully', async () => {
      const verifyOTPInput: VerifyOTPInput = {
        email: 'test@example.com',
        otp: '123456',
      };

      mockOtpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified' });
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.completeOTPVerification(verifyOTPInput);

      expect(result).toEqual({
        success: true,
        token: 'mock-token',
        message: 'OTP verified successfully',
        user: mockUser,
      });
      expect(mockUserService.markEmailAsVerified).toHaveBeenCalledWith('test@example.com');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
        { expiresIn: '7d' }
      );
    });

    it('should return invalid OTP', async () => {
      const verifyOTPInput: VerifyOTPInput = {
        email: 'test@example.com',
        otp: 'wrong-otp',
      };

      mockOtpService.verifyOTP.mockResolvedValue({ success: false, message: 'Invalid OTP' });

      const result = await service.completeOTPVerification(verifyOTPInput);

      expect(result).toEqual({
        success: false,
        message: 'Invalid OTP',
      });
    });

    it('should return user not found', async () => {
      const verifyOTPInput: VerifyOTPInput = {
        email: 'test@example.com',
        otp: '123456',
      };

      mockOtpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified' });
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.completeOTPVerification(verifyOTPInput);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle service errors', async () => {
      const verifyOTPInput: VerifyOTPInput = {
        email: 'test@example.com',
        otp: '123456',
      };

      mockOtpService.verifyOTP.mockRejectedValue(new Error('OTP service error'));

      await expect(service.completeOTPVerification(verifyOTPInput)).rejects.toThrow('Failed to complete OTP verification');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset OTP successfully', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(forgotPasswordInput);

      expect(result).toEqual({
        success: true,
        message: 'Password reset OTP sent to your email',
      });
      expect(mockOtpService.generateOTP).toHaveBeenCalledWith('test@example.com', 'PASSWORD_RESET', 1);
      expect(mockEmailService.sendEmailTemplate).toHaveBeenCalled();
    });

    it('should return user not found', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'nonexistent@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'No account found with this email address',
      });
    });

    it('should return account deleted', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const deletedUser = { ...mockUser, isDeleted: true };
      mockUserService.findByEmail.mockResolvedValue(deletedUser);

      const result = await service.forgotPassword(forgotPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'Account has been deleted',
        accountDeleted: true,
      });
    });

    it('should return email not verified', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUserService.findByEmail.mockResolvedValue(unverifiedUser);

      const result = await service.forgotPassword(forgotPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'Email not verified. Verification OTP sent to your email.',
        requiresEmailVerification: true,
      });
    });

    it('should throw error when email is empty', async () => {
      const forgotPasswordInput = {
        email: '',
      };

      await expect(service.forgotPassword(forgotPasswordInput)).rejects.toThrow('Email is required');
    });

    it('should handle service errors', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.forgotPassword(forgotPasswordInput)).rejects.toThrow('Failed to process forgot password request');
    });
  });

  describe('verifyForgotPasswordOTP', () => {
    it('should verify forgot password OTP successfully', async () => {
      const verifyForgotPasswordOTPInput: VerifyForgotPasswordOTPInput = {
        email: 'test@example.com',
        otp: '123456',
      };

      mockOtpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified' });

      const result = await service.verifyForgotPasswordOTP(verifyForgotPasswordOTPInput);

      expect(result).toEqual({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        resetToken: 'mock-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          type: 'PASSWORD_RESET',
        },
        { expiresIn: '15m' }
      );
    });

    it('should return invalid OTP', async () => {
      const verifyForgotPasswordOTPInput: VerifyForgotPasswordOTPInput = {
        email: 'test@example.com',
        otp: 'wrong-otp',
      };

      mockOtpService.verifyOTP.mockResolvedValue(null);

      const result = await service.verifyForgotPasswordOTP(verifyForgotPasswordOTPInput);

      expect(result).toEqual({
        success: false,
        message: 'Invalid or expired OTP',
      });
    });

    it('should throw error when email is empty', async () => {
      const verifyForgotPasswordOTPInput = {
        email: '',
        otp: '123456',
      };

      await expect(service.verifyForgotPasswordOTP(verifyForgotPasswordOTPInput)).rejects.toThrow('Email is required');
    });

    it('should throw error when OTP is empty', async () => {
      const verifyForgotPasswordOTPInput = {
        email: 'test@example.com',
        otp: '',
      };

      await expect(service.verifyForgotPasswordOTP(verifyForgotPasswordOTPInput)).rejects.toThrow('OTP is required');
    });

    it('should handle service errors', async () => {
      const verifyForgotPasswordOTPInput: VerifyForgotPasswordOTPInput = {
        email: 'test@example.com',
        otp: '123456',
      };

      mockOtpService.verifyOTP.mockRejectedValue(new Error('OTP service error'));

      await expect(service.verifyForgotPasswordOTP(verifyForgotPasswordOTPInput)).rejects.toThrow('Failed to verify OTP');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: 'valid-token',
      };

      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.resetPassword(resetPasswordInput);

      expect(result).toEqual({
        success: true,
        token: 'mock-token',
        message: 'Password reset successful',
        user: mockUser,
      });
      expect(mockUserService.update).toHaveBeenCalledWith(1, {
        password: expect.any(String),
        isEmailVerified: true,
        emailVerifiedAt: expect.any(Date),
      });
      expect(mockEmailService.sendEmailTemplate).toHaveBeenCalled();
    });

    it('should return invalid token', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: 'invalid-token',
      };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.resetPassword(resetPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    it('should return token email mismatch', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: 'valid-token',
      };

      mockJwtService.verify.mockReturnValue({
        email: 'different@example.com',
        type: 'PASSWORD_RESET',
      });

      const result = await service.resetPassword(resetPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'Token email mismatch',
      });
    });

    it('should return user not found', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: 'valid-token',
      };

      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.resetPassword(resetPasswordInput);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });

    it('should throw error when email is empty', async () => {
      const resetPasswordInput = {
        email: '',
        newPassword: 'newPassword123',
        resetToken: 'valid-token',
      };

      // Ensure JWT service mock doesn't interfere
      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });

      await expect(service.resetPassword(resetPasswordInput)).rejects.toThrow('Email is required');
    });

    it('should throw error when new password is empty', async () => {
      const resetPasswordInput = {
        email: 'test@example.com',
        newPassword: '',
        resetToken: 'valid-token',
      };

      // Ensure JWT service mock doesn't interfere
      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });

      await expect(service.resetPassword(resetPasswordInput)).rejects.toThrow('New password is required');
    });

    it('should throw error when new password is too short', async () => {
      const resetPasswordInput = {
        email: 'test@example.com',
        newPassword: '123',
        resetToken: 'valid-token',
      };

      // Ensure JWT service mock doesn't interfere
      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });

      await expect(service.resetPassword(resetPasswordInput)).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error when reset token is empty', async () => {
      const resetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: '',
      };

      await expect(service.resetPassword(resetPasswordInput)).rejects.toThrow('Reset token is required');
    });

    it('should handle service errors', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        newPassword: 'newPassword123',
        resetToken: 'valid-token',
      };

      mockJwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'PASSWORD_RESET',
      });
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.update.mockRejectedValue(new Error('Database error'));

      await expect(service.resetPassword(resetPasswordInput)).rejects.toThrow('Failed to reset password');
    });

    describe('Password validation edge cases', () => {
      it('should handle password strength validation failure', async () => {
        const signupInput: SignupInput = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'weakpassword',
          userType: 'CUSTOMER' as UserType,
        };

        jest.spyOn(PasswordUtil, 'validatePasswordStrength').mockReturnValue({
          isValid: false,
          message: 'Password must contain at least one uppercase letter'
        });

        await expect(service.signup(signupInput)).rejects.toThrow('Password must contain at least one uppercase letter');
      });

      it('should handle password comparison failure', async () => {
        const loginInput: LoginInput = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        mockUserService.findByEmail.mockResolvedValue(mockUser);
        jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(false);

        const result = await service.login(loginInput);

        expect(result).toEqual({
          success: false,
          message: 'Invalid password'
        });
      });
    });
  });
});
