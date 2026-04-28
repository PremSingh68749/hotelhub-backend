import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { RoomType } from '../../database/models/room-type.model';
import { RoomTypeImage } from '../../database/models/room-type-image.model';
import { RoomTypeRepository } from './room-type.repository';
import { CreateRoomTypeWithImagesInput, UpdateRoomTypeWithImagesInput } from './dto/room-type-with-images.input';
import { FileUploadService } from '../../common/services/file-upload.service';
import { HotelRepository } from '../hotel/hotel.repository';

@Injectable()
export class RoomTypeWithImagesService {
  constructor(
    private readonly roomTypeRepository: RoomTypeRepository,
    @Inject(forwardRef(() => HotelRepository))
    private readonly hotelRepository: HotelRepository,
    private readonly fileUploadService: FileUploadService
  ) {}

  async createWithImages(createRoomTypeInput: CreateRoomTypeWithImagesInput, ownerId: number): Promise<RoomType> {
    try {
      // Verify hotel ownership
      const hotel = await this.hotelRepository.findById(createRoomTypeInput.hotelId);
      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }
      if (hotel.ownerId !== ownerId) {
        throw new ForbiddenException('You can only create room types for your own hotels');
      }

      // Create room type first
      const { imageUpload, amenities, images, ...roomTypeDataWithoutArrays } = createRoomTypeInput;
      
      const roomTypeData = {
        ...roomTypeDataWithoutArrays,
        amenities: amenities ? JSON.stringify(amenities) : null,
        images: images ? JSON.stringify(images) : null
      };
      
      const roomType = await this.roomTypeRepository.create(roomTypeData);

      // Handle image uploads if provided
      if (imageUpload && imageUpload.files && imageUpload.files.length > 0) {
        await this.uploadRoomTypeImages(roomType.id, imageUpload.files, imageUpload.imageData);
      }

      // Return room type with images
      return this.roomTypeRepository.findById(roomType.id);
    } catch (error) {
      throw new GraphQLError(`Failed to create room type with images: ${error.message}`, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  async updateWithImages(roomTypeId: number, updateRoomTypeInput: UpdateRoomTypeWithImagesInput, ownerId: number): Promise<RoomType> {
    try {
      // Check if user owns the room type's hotel
      const existingRoomType = await this.roomTypeRepository.findById(roomTypeId);
      if (!existingRoomType) {
        throw new NotFoundException('Room type not found');
      }

      const hotel = await this.hotelRepository.findById(existingRoomType.hotelId);
      if (hotel.ownerId !== ownerId) {
        throw new ForbiddenException('You can only update room types for your own hotels');
      }

      // Handle new image uploads
      if (updateRoomTypeInput.newImages && updateRoomTypeInput.newImages.files && updateRoomTypeInput.newImages.files.length > 0) {
        await this.uploadRoomTypeImages(roomTypeId, updateRoomTypeInput.newImages.files, updateRoomTypeInput.newImages.imageData);
      }

      // Handle image deletions
      if (updateRoomTypeInput.deleteImageIds && updateRoomTypeInput.deleteImageIds.length > 0) {
        await this.deleteRoomTypeImages(updateRoomTypeInput.deleteImageIds);
      }

      // Update room type data
      const { newImages, deleteImageIds, amenities, images, ...roomTypeDataWithoutArrays } = updateRoomTypeInput;
      
      const roomTypeData = {
        ...roomTypeDataWithoutArrays,
        amenities: amenities ? JSON.stringify(amenities) : undefined,
        images: images ? JSON.stringify(images) : undefined
      };
      
      const updatedRoomType = await this.roomTypeRepository.update(roomTypeId, roomTypeData);
      
      // Return room type with images
      return this.roomTypeRepository.findById(roomTypeId);
    } catch (error) {
      throw new GraphQLError(`Failed to update room type with images: ${error.message}`, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  private async uploadRoomTypeImages(roomTypeId: number, files: any[], imageData?: any[]): Promise<void> {
    try {
      // Upload files to Cloudinary
      const uploadResults = await this.fileUploadService.uploadMultipleFiles(
        files,
        'ROOM_TYPES'
      );

      // Create image records in database
      const imagePromises = uploadResults.map(async (result, index) => {
        const imageInfo = imageData?.[index] || {};
        const publicId = this.fileUploadService.extractPublicIdFromUrl(result.url);
        
        return RoomTypeImage.create({
          roomTypeId,
          url: result.secureUrl,
          altText: imageInfo.altText,
          caption: imageInfo.caption,
          isPrimary: imageInfo.isPrimary || false,
          sortOrder: imageInfo.sortOrder || index,
          publicId,
        });
      });

      await Promise.all(imagePromises);

      // Ensure only one primary image
      await this.ensureSinglePrimaryImage(roomTypeId);
    } catch (error) {
      throw new GraphQLError(`Failed to upload room type images: ${error.message}`, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  private async deleteRoomTypeImages(imageIds: number[]): Promise<void> {
    try {
      // Get images to delete
      const images = await RoomTypeImage.findAll({
        where: { id: imageIds }
      });

      // Delete from Cloudinary
      const publicIds = images
        .filter(img => img.publicId)
        .map(img => img.publicId);

      if (publicIds.length > 0) {
        await this.fileUploadService.deleteMultipleFiles(publicIds);
      }

      // Delete from database
      await RoomTypeImage.destroy({
        where: { id: imageIds }
      });
    } catch (error) {
      throw new GraphQLError(`Failed to delete room type images: ${error.message}`, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  private async ensureSinglePrimaryImage(roomTypeId: number): Promise<void> {
    try {
      // Find all primary images
      const primaryImages = await RoomTypeImage.findAll({
        where: { roomTypeId, isPrimary: true }
      });

      // If multiple primary images, keep only the first one
      if (primaryImages.length > 1) {
        const toUpdate = primaryImages.slice(1);
        await Promise.all(
          toUpdate.map(img => img.update({ isPrimary: false }))
        );
      }

      // If no primary image, set the first image as primary
      if (primaryImages.length === 0) {
        const firstImage = await RoomTypeImage.findOne({
          where: { roomTypeId },
          order: [['sortOrder', 'ASC']]
        });

        if (firstImage) {
          await firstImage.update({ isPrimary: true });
        }
      }
    } catch (error) {
      console.error('Error ensuring single primary image:', error);
    }
  }
}
