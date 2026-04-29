import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Room } from '../../database/models/room.model';
import { RoomType } from '../../database/models/room-type.model';
import { Op } from 'sequelize';

@Injectable()
export class RoomRepository {
  constructor(
    @InjectModel(Room)
    private roomModel: typeof Room,
  ) {}

  /**
   * Create a new room
   * 
   * @param roomData - Room data
   * @returns Created room
   */
  async create(roomData: Partial<Room>): Promise<Room> {
    return await this.roomModel.create(roomData);
  }

  /**
   * Find room by ID
   * 
   * @param id - Room ID
   * @returns Room or null
   */
  async findById(id: number): Promise<Room | null> {
    return await this.roomModel.findByPk(id, {
      include: [
        {
          model: RoomType,
          as: 'roomType'
        }
      ]
    });
  }

  /**
   * Find rooms by room type ID
   * 
   * @param roomTypeId - Room type ID
   * @returns Array of rooms
   */
  async findByRoomTypeId(roomTypeId: number): Promise<Room[]> {
    return await this.roomModel.findAll({
      where: { roomTypeId },
      include: [
        {
          model: RoomType,
          as: 'roomType'
        }
      ],
      order: [['roomNumber', 'ASC']]
    });
  }

  /**
   * Find rooms by hotel ID (through room type)
   * 
   * @param hotelId - Hotel ID
   * @returns Array of rooms
   */
  async findByHotelId(hotelId: number): Promise<Room[]> {
    return await this.roomModel.findAll({
      include: [
        {
          model: RoomType,
          as: 'roomType',
          where: { hotelId }
        }
      ],
      order: [['roomNumber', 'ASC']]
    });
  }

  /**
   * Find room by room number within a hotel
   * 
   * @param hotelId - Hotel ID
   * @param roomNumber - Room number
   * @returns Room or null
   */
  async findByRoomNumber(hotelId: number, roomNumber: string): Promise<Room | null> {
    return await this.roomModel.findOne({
      include: [
        {
          model: RoomType,
          as: 'roomType',
          where: { hotelId }
        }
      ],
      where: { roomNumber }
    });
  }

  /**
   * Get hotel ID by room ID (through room type)
   * 
   * @param roomId - Room ID
   * @returns Hotel ID or null
   */
  async getHotelIdByRoomId(roomId: number): Promise<number | null> {
    const room = await this.roomModel.findByPk(roomId, {
      include: [
        {
          model: RoomType,
          as: 'roomType',
          attributes: ['hotelId']
        }
      ]
    });

    return room?.roomType?.hotelId || null;
  }

  /**
   * Search rooms with filters
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching rooms
   */
  async search(searchInput: any): Promise<Room[]> {
    const whereConditions: any = {};

    // Room type filter
    if (searchInput.roomTypeId) {
      whereConditions.roomTypeId = searchInput.roomTypeId;
    }

    // Hotel filter (through room type)
    if (searchInput.hotelId) {
      whereConditions['$roomType.hotelId$'] = searchInput.hotelId;
    }

    // Room number filter
    if (searchInput.roomNumber) {
      whereConditions.roomNumber = { [Op.iLike]: `%${searchInput.roomNumber}%` };
    }

    // Status filter
    if (searchInput.status) {
      whereConditions.status = searchInput.status;
    }

    // Floor filter
    if (searchInput.floor) {
      whereConditions.floor = { [Op.iLike]: `%${searchInput.floor}%` };
    }

    // Price range filter
    if (searchInput.minPrice !== undefined) {
      whereConditions.customPrice = { [Op.gte]: searchInput.minPrice };
    }

    if (searchInput.maxPrice !== undefined) {
      whereConditions.customPrice = {
        ...whereConditions.customPrice,
        [Op.lte]: searchInput.maxPrice
      };
    }

    return await this.roomModel.findAll({
      where: whereConditions,
      include: [
        {
          model: RoomType,
          as: 'roomType'
        }
      ],
      order: [['roomNumber', 'ASC']],
      limit: searchInput.limit || 20,
      offset: searchInput.offset || 0
    });
  }

  /**
   * Update room
   * 
   * @param id - Room ID
   * @param updateData - Update data
   * @returns Updated room
   */
  async update(id: number, updateData: Partial<Room>): Promise<Room> {
    await this.roomModel.update(updateData, {
      where: { id }
    });
    return this.findById(id);
  }

  /**
   * Delete room
   * 
   * @param id - Room ID
   */
  async delete(id: number): Promise<void> {
    await this.roomModel.destroy({
      where: { id }
    });
  }

  /**
   * Get room count
   * 
   * @returns Number of rooms
   */
  async count(): Promise<number> {
    return await this.roomModel.count();
  }

  /**
   * Get available rooms for booking
   * 
   * @param roomTypeId - Room type ID
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   * @returns Array of available rooms
   */
  async findAvailableRooms(roomTypeId: number, checkInDate: Date, checkOutDate: Date): Promise<Room[]> {
    return await this.roomModel.findAll({
      where: {
        roomTypeId,
        status: 'AVAILABLE'
      },
      include: [
        {
          model: RoomType,
          as: 'roomType'
        }
      ],
      order: [['roomNumber', 'ASC']]
    });
  }
}
