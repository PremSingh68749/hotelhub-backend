import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { Room, RoomStatus } from '../../database/models/room.model';
import { RoomRepository } from './room.repository';
import { CreateRoomInput, UpdateRoomInput, SearchRoomsInput } from './dto/room.input';

@Injectable()
export class RoomService {
  constructor(private readonly roomRepository: RoomRepository) {}

  /**
   * Create a new room
   * 
   * @param createRoomInput - Room data
   * @param roomTypeId - Room type ID
   * @param hotelId - Hotel ID for authorization
   * @returns Created room
   * 
   * @throws GraphQLError - If creation fails
   */
  async create(createRoomInput: CreateRoomInput, roomTypeId: number, hotelId: number): Promise<Room> {
    try {
      // Validate input
      if (!createRoomInput.roomNumber || createRoomInput.roomNumber.trim().length === 0) {
        throw new GraphQLError('Room number is required', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'roomNumber'
          }
        });
      }

      if (!roomTypeId || roomTypeId <= 0) {
        throw new GraphQLError('Valid room type ID is required', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'roomTypeId'
          }
        });
      }

      // Check if room number already exists for this hotel
      const existingRoom = await this.roomRepository.findByRoomNumber(hotelId, createRoomInput.roomNumber.trim());
      if (existingRoom) {
        throw new GraphQLError('Room number already exists in this hotel', {
          extensions: {
            code: 'CONFLICT',
            field: 'roomNumber'
          }
        });
      }

      const { images, ...roomDataWithoutImages } = createRoomInput;
      
      const roomData = {
        ...roomDataWithoutImages,
        roomNumber: createRoomInput.roomNumber.trim(),
        roomTypeId,
        status: (createRoomInput.status as RoomStatus) || RoomStatus.AVAILABLE,
        images: createRoomInput.images ? JSON.stringify(createRoomInput.images) : null
      };

      return await this.roomRepository.create(roomData);
    } catch (error) {
      throw new GraphQLError('Failed to create room', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get room by ID
   * 
   * @param id - Room ID
   * @returns Room details
   * 
   * @throws GraphQLError - If room not found
   */
  async findById(id: number): Promise<Room> {
    try {
      const room = await this.roomRepository.findById(id);
      if (!room) {
        throw new NotFoundException('Room not found');
      }
      return room;
    } catch (error) {
      throw new GraphQLError('Failed to retrieve room', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get rooms by room type ID
   * 
   * @param roomTypeId - Room type ID
   * @returns Array of rooms
   */
  async findByRoomTypeId(roomTypeId: number): Promise<Room[]> {
    try {
      return await this.roomRepository.findByRoomTypeId(roomTypeId);
    } catch (error) {
      throw new GraphQLError('Failed to retrieve rooms', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get rooms by hotel ID
   * 
   * @param hotelId - Hotel ID
   * @returns Array of rooms
   */
  async findByHotelId(hotelId: number): Promise<Room[]> {
    try {
      return await this.roomRepository.findByHotelId(hotelId);
    } catch (error) {
      throw new GraphQLError('Failed to retrieve rooms', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Search rooms with filters
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching rooms
   */
  async search(searchInput: SearchRoomsInput): Promise<Room[]> {
    try {
      return await this.roomRepository.search(searchInput);
    } catch (error) {
      throw new GraphQLError('Failed to search rooms', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Update room
   * 
   * @param id - Room ID
   * @param updateRoomInput - Update data
   * @param hotelId - Hotel ID for authorization
   * @returns Updated room
   * 
   * @throws GraphQLError - If update fails or unauthorized
   */
  async update(id: number, updateRoomInput: UpdateRoomInput, hotelId: number): Promise<Room> {
    try {
      // Check if room exists and belongs to hotel
      const existingRoom = await this.roomRepository.findById(id);
      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      // Verify room belongs to hotel (through room type)
      const roomTypeHotelId = await this.roomRepository.getHotelIdByRoomId(id);
      if (roomTypeHotelId !== hotelId) {
        throw new ForbiddenException('You can only update rooms in your own hotels');
      }

      // If updating room number, check for duplicates
      if (updateRoomInput.roomNumber) {
        const duplicateRoom = await this.roomRepository.findByRoomNumber(hotelId, updateRoomInput.roomNumber.trim());
        if (duplicateRoom && duplicateRoom.id !== id) {
          throw new GraphQLError('Room number already exists in this hotel', {
            extensions: {
              code: 'CONFLICT',
              field: 'roomNumber'
            }
          });
        }
      }

      const { images, ...updateDataWithoutImages } = updateRoomInput;
      
      const updateData = {
        ...updateDataWithoutImages,
        roomNumber: updateRoomInput.roomNumber?.trim() || existingRoom.roomNumber,
        images: updateRoomInput.images ? JSON.stringify(updateRoomInput.images) : existingRoom.images
      };

      return await this.roomRepository.update(id, updateData);
    } catch (error) {
      throw new GraphQLError('Failed to update room', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Delete room
   * 
   * @param id - Room ID
   * @param hotelId - Hotel ID for authorization
   * @returns Success message
   * 
   * @throws GraphQLError - If delete fails or unauthorized
   */
  async delete(id: number, hotelId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if room exists and belongs to hotel
      const existingRoom = await this.roomRepository.findById(id);
      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      // Verify room belongs to hotel (through room type)
      const roomTypeHotelId = await this.roomRepository.getHotelIdByRoomId(id);
      if (roomTypeHotelId !== hotelId) {
        throw new ForbiddenException('You can only delete rooms in your own hotels');
      }

      await this.roomRepository.delete(id);
      return {
        success: true,
        message: 'Room deleted successfully'
      };
    } catch (error) {
      throw new GraphQLError('Failed to delete room', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Update room status
   * 
   * @param id - Room ID
   * @param status - Room status
   * @param hotelId - Hotel ID for authorization
   * @returns Updated room
   */
  async updateStatus(id: number, status: string, hotelId: number): Promise<Room> {
    try {
      // Check if room exists and belongs to hotel
      const existingRoom = await this.roomRepository.findById(id);
      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      // Verify room belongs to hotel (through room type)
      const roomTypeHotelId = await this.roomRepository.getHotelIdByRoomId(id);
      if (roomTypeHotelId !== hotelId) {
        throw new ForbiddenException('You can only modify rooms in your own hotels');
      }

      return await this.roomRepository.update(id, { status: status as RoomStatus });
    } catch (error) {
      throw new GraphQLError('Failed to update room status', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get room count
   * 
   * @returns Number of rooms
   */
  async count(): Promise<number> {
    try {
      return await this.roomRepository.count();
    } catch (error) {
      throw new GraphQLError('Failed to count rooms', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }
}
