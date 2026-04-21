import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_FOLDERS, UPLOAD_CONFIG } from '../constants/cloudinary.constant';
import { ConfigService } from '../config/config.service';

interface FileUploadOptions {
  transformation?: any;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'auto';
}

interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {
    const cloudinaryConfig = this.configService.cloudinaryConfig;
    
    console.log('Cloudinary config:', {
      cloudName: cloudinaryConfig.cloudName,
      apiKey: cloudinaryConfig.apiKey ? '***CONFIGURED***' : '***MISSING***',
      apiSecret: cloudinaryConfig.apiSecret ? '***CONFIGURED***' : '***MISSING***',
    });
    
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });
  }

  async uploadFile(
    file: any,
    folder: keyof typeof CLOUDINARY_FOLDERS,
    options?: FileUploadOptions
  ): Promise<UploadResult> {
    console.log('File object received:', {
      hasFile: !!file,
      fileKeys: file ? Object.keys(file) : 'null',
      originalname: file?.originalname,
      size: file?.size,
      path: file?.path,
      buffer: file?.buffer ? 'has buffer' : 'no buffer'
    });

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxSize) {
      throw new BadRequestException(`File size exceeds ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB limit`);
    }

    // Validate file format
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !UPLOAD_CONFIG.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file format. Allowed formats: ${UPLOAD_CONFIG.allowedFormats.join(', ')}`
      );
    }

    try {
      const folderPath = CLOUDINARY_FOLDERS[folder];
      
      // For Cloudinary, we need to use the buffer with proper data URI format
      let uploadData;
      if (file.buffer) {
        uploadData = `data:image/${fileExtension};base64,${file.buffer.toString('base64')}`;
        console.log('Using buffer for upload');
      } else if (file.path) {
        uploadData = file.path;
        console.log('Using path for upload');
      } else {
        throw new BadRequestException('No file data available for upload');
      }
      
      const result = await cloudinary.uploader.upload(uploadData, {
        folder: folderPath,
        public_id: options?.publicId,
        resource_type: options?.resourceType || 'auto',
        transformation: options?.transformation || UPLOAD_CONFIG.transformations,
        format: fileExtension,
      });

      return {
        url: result.url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: any[],
    folder: keyof typeof CLOUDINARY_FOLDERS,
    options?: FileUploadOptions
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, folder, {
        ...options,
        publicId: options?.publicId ? `${options.publicId}_${index}` : undefined,
      })
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(`Failed to upload files: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    try {
      await Promise.all(publicIds.map(publicId => this.deleteFile(publicId)));
    } catch (error) {
      throw new BadRequestException(`Failed to delete files: ${error.message}`);
    }
  }

  generatePublicId(baseName: string, folder: keyof typeof CLOUDINARY_FOLDERS): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${CLOUDINARY_FOLDERS[folder]}/${baseName}_${timestamp}_${random}`;
  }

  extractPublicIdFromUrl(url: string): string {
    try {
      const urlParts = url.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      return publicIdWithExtension.split('.')[0];
    } catch (error) {
      throw new BadRequestException('Invalid Cloudinary URL');
    }
  }
}
