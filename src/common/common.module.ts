import { Module } from '@nestjs/common';
import { FileUploadService } from './services/file-upload.service';
import { UploadScalar } from './scalars/upload.scalar';
import { FileUploadResolver } from './resolvers/file-upload.resolver';
import { FileUploadController } from './controllers/file-upload.controller';
import { ConfigService } from './config/config.service';

@Module({
  providers: [FileUploadService, UploadScalar, FileUploadResolver, ConfigService],
  controllers: [FileUploadController],
  exports: [FileUploadService, UploadScalar, ConfigService],
})
export class CommonModule {}
