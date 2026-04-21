import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../services/file-upload.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RestAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new UnauthorizedException('JWT secret not configured');
      }
      
      const decoded = jwt.verify(token, jwtSecret);
      request.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

interface FileUploadResponse {
  success: boolean;
  urls?: string[];
  message?: string;
  error?: string;
}

@Controller('api/upload')
@UseGuards(RestAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('hotel-images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.OK)
  async uploadHotelImages(
    @UploadedFiles() files: any[],
  ): Promise<FileUploadResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        };
      }

      const results = await this.fileUploadService.uploadMultipleFiles(files, 'HOTELS');
      const urls = results.map(result => result.secureUrl);

      return {
        success: true,
        urls,
        message: `Successfully uploaded ${files.length} image(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload images: ${error.message}`
      };
    }
  }

  @Post('room-images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.OK)
  async uploadRoomImages(
    @UploadedFiles() files: any[],
  ): Promise<FileUploadResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        };
      }

      const results = await this.fileUploadService.uploadMultipleFiles(files, 'ROOMS');
      const urls = results.map(result => result.secureUrl);

      return {
        success: true,
        urls,
        message: `Successfully uploaded ${files.length} image(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload images: ${error.message}`
      };
    }
  }

  @Post('room-type-images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.OK)
  async uploadRoomTypeImages(
    @UploadedFiles() files: any[],
  ): Promise<FileUploadResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        };
      }

      const results = await this.fileUploadService.uploadMultipleFiles(files, 'ROOM_TYPES');
      const urls = results.map(result => result.secureUrl);

      return {
        success: true,
        urls,
        message: `Successfully uploaded ${files.length} image(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload images: ${error.message}`
      };
    }
  }

  @Post('general')
  @UseInterceptors(FilesInterceptor('files', 5))
  @HttpCode(HttpStatus.OK)
  async uploadGeneralFiles(
    @UploadedFiles() files: any[],
    @Body('folder') folder?: string,
  ): Promise<FileUploadResponse> {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        };
      }

      const targetFolder = folder || 'USERS';
      const results = await this.fileUploadService.uploadMultipleFiles(files, targetFolder as any);
      const urls = results.map(result => result.secureUrl);

      return {
        success: true,
        urls,
        message: `Successfully uploaded ${files.length} file(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload files: ${error.message}`
      };
    }
  }
}
