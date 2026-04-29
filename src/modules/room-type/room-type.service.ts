import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { RoomType } from '../../database/models/room-type.model';
import { RoomTypeRepository } from './room-type.repository';
import { CreateRoomTypeInput, UpdateRoomTypeInput, SearchRoomTypesInput } from './dto/room-type.input';

@Injectable()
export class RoomTypeService {
  constructor(private readonly roomTypeRepository: RoomTypeRepository) {}

  /**
   * Create a new room type
   * 
   * @param createRoomTypeInput - Room type data
   * @param hotelId - Hotel ID for authorization
   * @returns Created room type
   * 
   * @throws GraphQLError - If creation fails
   */
  async create(createRoomTypeInput: CreateRoomTypeInput, hotelId: number): Promise<RoomType> {
    try {
      // Validate input
      if (!createRoomTypeInput.name || createRoomTypeInput.name.trim().length === 0) {
        throw new GraphQLError('Room type name is required', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'name'
          }
        });
      }

      if (!createRoomTypeInput.basePrice || createRoomTypeInput.basePrice <= 0) {
        throw new GraphQLError('Base price must be greater than 0', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'basePrice'
          }
        });
      }

      if (!createRoomTypeInput.maxOccupancy || createRoomTypeInput.maxOccupancy <= 0) {
        throw new GraphQLError('Max occupancy must be greater than 0', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'maxOccupancy'
          }
        });
      }

      const { amenities, images, maxAdults, maxChildren, ...roomTypeDataWithoutArrays } = createRoomTypeInput;

      const roomTypeData = {
        ...roomTypeDataWithoutArrays,
        name: createRoomTypeInput.name.trim(),
        description: createRoomTypeInput.description?.trim() || '',
        hotelId,
        isActive: true,
        adults: maxAdults,
        children: maxChildren ?? 0,
        amenities: createRoomTypeInput.amenities ? createRoomTypeInput.amenities : null,
        images: createRoomTypeInput.images ? JSON.stringify(createRoomTypeInput.images) : null
      };

      return await this.roomTypeRepository.create(roomTypeData);
    } catch (error) {
      throw new GraphQLError('Failed to create room type', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get room type by ID
   * 
   * @param id - Room type ID
   * @returns Room type details
   * 
   * @throws GraphQLError - If room type not found
   */
  async findById(id: number): Promise<RoomType> {
    try {
      const roomType = await this.roomTypeRepository.findById(id);
      if (!roomType) {
        throw new NotFoundException('Room type not found');
      }
      return roomType;
    } catch (error) {
      throw new GraphQLError('Failed to retrieve room type', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get room types by hotel ID
   * 
   * @param hotelId - Hotel ID
   * @returns Array of room types
   */
  async findByHotelId(hotelId: number): Promise<RoomType[]> {
    try {
      return await this.roomTypeRepository.findByHotelId(hotelId);
    } catch (error) {
      throw new GraphQLError('Failed to retrieve room types', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Search room types with filters
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching room types
   */
  async search(searchInput: SearchRoomTypesInput): Promise<RoomType[]> {
    try {
      return await this.roomTypeRepository.search(searchInput);
    } catch (error) {
      throw new GraphQLError('Failed to search room types', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Update room type
   * 
   * @param id - Room type ID
   * @param updateRoomTypeInput - Update data
   * @param hotelId - Hotel ID for authorization
   * @returns Updated room type
   * 
   * @throws GraphQLError - If update fails or unauthorized
   */
  async update(id: number, updateRoomTypeInput: UpdateRoomTypeInput, hotelId: number): Promise<RoomType> {
    console.log('updateRoomTypeInput', updateRoomTypeInput);
    console.log('hotelId', hotelId);
    console.log('id', id);
    try {
      // Check if room type exists and belongs to hotel
      const existingRoomType = await this.roomTypeRepository.findById(id);
      if (!existingRoomType) {
        throw new NotFoundException('Room type not found');
      }

      if (existingRoomType.hotelId !== hotelId) {
        throw new ForbiddenException('You can only update room types for your own hotels');
      }

      const { amenities, images, maxAdults, maxChildren, ...updateDataWithoutArrays } = updateRoomTypeInput;

      const updateData: Partial<RoomType> = {
        ...updateDataWithoutArrays,
        name: updateRoomTypeInput.name?.trim() || existingRoomType.name,
        description: updateRoomTypeInput.description?.trim() || existingRoomType.description,
        amenities: updateRoomTypeInput.amenities ? JSON.stringify(updateRoomTypeInput.amenities) : existingRoomType.amenities,
        images: updateRoomTypeInput.images ? JSON.stringify(updateRoomTypeInput.images) : existingRoomType.images
      };

      if (maxAdults !== undefined) {
        updateData.adults = maxAdults;
      }
      if (maxChildren !== undefined) {
        updateData.children = maxChildren;
      }

      return await this.roomTypeRepository.update(id, updateData);
    } catch (error) {
      console.error('Error updating room type:', error);
      throw new GraphQLError('Failed to update room type', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Delete room type
   * 
   * @param id - Room type ID
   * @param hotelId - Hotel ID for authorization
   * @returns Success message
   * 
   * @throws GraphQLError - If delete fails or unauthorized
   */
  async delete(id: number, hotelId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if room type exists and belongs to hotel
      const existingRoomType = await this.roomTypeRepository.findById(id);
      if (!existingRoomType) {
        throw new NotFoundException('Room type not found');
      }

      if (existingRoomType.hotelId !== hotelId) {
        throw new ForbiddenException('You can only delete room types for your own hotels');
      }

      await this.roomTypeRepository.delete(id);
      return {
        success: true,
        message: 'Room type deleted successfully'
      };
    } catch (error) {
      throw new GraphQLError('Failed to delete room type', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Toggle room type active status
   * 
   * @param id - Room type ID
   * @param isActive - Active status
   * @param hotelId - Hotel ID for authorization
   * @returns Updated room type
   */
  async toggleActiveStatus(id: number, isActive: boolean, hotelId: number): Promise<RoomType> {
    try {
      // Check if room type exists and belongs to hotel
      const existingRoomType = await this.roomTypeRepository.findById(id);
      if (!existingRoomType) {
        throw new NotFoundException('Room type not found');
      }

      if (existingRoomType.hotelId !== hotelId) {
        throw new ForbiddenException('You can only modify room types for your own hotels');
      }

      return await this.roomTypeRepository.update(id, { isActive });
    } catch (error) {
      throw new GraphQLError('Failed to update room type status', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }
}
