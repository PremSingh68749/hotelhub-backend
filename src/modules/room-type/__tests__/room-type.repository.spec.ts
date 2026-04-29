import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RoomTypeRepository } from '../room-type.repository';
import { RoomType } from '../../../database/models/room-type.model';

describe('RoomTypeRepository', () => {
  let repository: RoomTypeRepository;
  let mockRoomTypeModel: jest.Mocked<typeof RoomType>;

  const mockRoomType = {
    id: 1,
    name: 'Deluxe Suite',
    description: 'A luxurious suite',
    basePrice: 1000,
    maxOccupancy: 3,
    adults: 2,
    children: 1,
    numberOfBeds: 1,
    bedType: 'King',
    roomSize: 800,
    amenities: '["WiFi", "TV"]',
    images: '["image1.jpg", "image2.jpg"]',
    isActive: true,
    hotelId: 21,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockRoomTypeModelStatic = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeRepository,
        {
          provide: getModelToken(RoomType),
          useValue: mockRoomTypeModelStatic,
        },
      ],
    }).compile();

    repository = module.get<RoomTypeRepository>(RoomTypeRepository);
    mockRoomTypeModel = module.get(getModelToken(RoomType));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new room type', async () => {
      const roomTypeData = {
        name: 'Deluxe Suite',
        basePrice: 1000,
        maxOccupancy: 3,
        adults: 2,
        hotelId: 21,
      };

      mockRoomTypeModelStatic.create.mockResolvedValue(mockRoomType as any);

      const result = await repository.create(roomTypeData);

      expect(mockRoomTypeModelStatic.create).toHaveBeenCalledWith(roomTypeData);
      expect(result).toEqual(mockRoomType);
    });
  });

  describe('findById', () => {
    it('should find room type by id', async () => {
      mockRoomTypeModelStatic.findByPk.mockResolvedValue(mockRoomType as any);

      const result = await repository.findById(1);

      expect(mockRoomTypeModelStatic.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRoomType);
    });

    it('should return null when room type not found', async () => {
      mockRoomTypeModelStatic.findByPk.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByHotelId', () => {
    it('should find room types by hotel id', async () => {
      const roomTypes = [mockRoomType, { ...mockRoomType, id: 2 }];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.findByHotelId(21);

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: { hotelId: 21 },
        order: [['name', 'ASC']],
      });
      expect(result).toEqual(roomTypes);
    });

    it('should return empty array when no room types found', async () => {
      mockRoomTypeModelStatic.findAll.mockResolvedValue([]);

      const result = await repository.findByHotelId(999);

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('should search with hotelId filter', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ hotelId: 21 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          hotelId: 21,
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should search with name filter using iLike', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ name: 'Deluxe' });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          name: { [Op.iLike]: '%Deluxe%' },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should search with minPrice filter', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ minPrice: 500 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          basePrice: { [Op.gte]: 500 },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should search with maxPrice filter', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ maxPrice: 1500 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          basePrice: { [Op.lte]: 1500 },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should combine minPrice and maxPrice filters', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      await repository.search({ minPrice: 500, maxPrice: 1500 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          basePrice: {
            [Op.gte]: 500,
            [Op.lte]: 1500,
          },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
    });

    it('should search with maxOccupancy filter', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ maxOccupancy: 4 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          maxOccupancy: { [Op.gte]: 4 },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should search with amenities filter using contains', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      const result = await repository.search({ amenities: ['WiFi', 'TV'] });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          amenities: { [Op.contains]: ['WiFi', 'TV'] },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(roomTypes);
    });

    it('should use custom limit and offset', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      await repository.search({ limit: 10, offset: 5 });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
    });

    it('should combine multiple filters', async () => {
      const roomTypes = [mockRoomType];
      mockRoomTypeModelStatic.findAll.mockResolvedValue(roomTypes as any);

      await repository.search({
        hotelId: 21,
        name: 'Deluxe',
        minPrice: 500,
        maxPrice: 1500,
        maxOccupancy: 4,
      });

      expect(mockRoomTypeModelStatic.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          hotelId: 21,
          name: { [Op.iLike]: '%Deluxe%' },
          basePrice: {
            [Op.gte]: 500,
            [Op.lte]: 1500,
          },
          maxOccupancy: { [Op.gte]: 4 },
        },
        order: [['basePrice', 'ASC']],
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('update', () => {
    it('should update room type and return updated entity', async () => {
      const updateData = { name: 'Updated Suite', basePrice: 1200 };
      mockRoomTypeModelStatic.update.mockResolvedValue([1, [mockRoomType]]);
      mockRoomTypeModelStatic.findByPk.mockResolvedValue({ ...mockRoomType, ...updateData } as any);

      const result = await repository.update(1, updateData);

      expect(mockRoomTypeModelStatic.update).toHaveBeenCalledWith(updateData, {
        where: { id: 1 },
      });
      expect(mockRoomTypeModelStatic.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual({ ...mockRoomType, ...updateData });
    });
  });

  describe('delete', () => {
    it('should delete room type', async () => {
      mockRoomTypeModelStatic.destroy.mockResolvedValue(1);

      await repository.delete(1);

      expect(mockRoomTypeModelStatic.destroy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('count', () => {
    it('should return room type count', async () => {
      mockRoomTypeModelStatic.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(mockRoomTypeModelStatic.count).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });
});
