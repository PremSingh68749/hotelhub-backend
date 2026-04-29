import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypeResolver } from '../room-type.resolver';
import { RoomTypeService } from '../room-type.service';
import { RoomType } from '../../../database/models/room-type.model';
import { CreateRoomTypeInput, UpdateRoomTypeInput, SearchRoomTypesInput } from '../dto/room-type.input';

describe('RoomTypeResolver', () => {
  let resolver: RoomTypeResolver;
  let service: jest.Mocked<RoomTypeService>;

  const mockRoomType: Partial<RoomType> = {
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

  const mockRoomTypeService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByHotelId: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleActiveStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeResolver,
        {
          provide: RoomTypeService,
          useValue: mockRoomTypeService,
        },
      ],
    }).compile();

    resolver = module.get<RoomTypeResolver>(RoomTypeResolver);
    service = module.get(RoomTypeService);

    jest.clearAllMocks();
  });

  describe('roomTypes query', () => {
    it('should return room types for hotel', async () => {
      const roomTypes = [{ ...mockRoomType }, { ...mockRoomType, id: 2 }] as RoomType[];
      service.findByHotelId.mockResolvedValue(roomTypes);

      const result = await resolver.roomTypes(21);

      expect(service.findByHotelId).toHaveBeenCalledWith(21);
      expect(result).toEqual(roomTypes);
    });

    it('should return all room types when hotelId is not provided', async () => {
      const roomTypes = [{ ...mockRoomType }] as RoomType[];
      service.findByHotelId.mockResolvedValue(roomTypes);

      const result = await resolver.roomTypes(undefined);

      expect(service.findByHotelId).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(roomTypes);
    });
  });

  describe('roomType query', () => {
    it('should return room type by id', async () => {
      const roomType = { ...mockRoomType } as RoomType;
      service.findById.mockResolvedValue(roomType);

      const result = await resolver.roomType(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(roomType);
    });
  });

  describe('searchRoomTypes query', () => {
    it('should search room types with filters', async () => {
      const roomTypes = [{ ...mockRoomType }] as RoomType[];
      const searchInput: SearchRoomTypesInput = {
        hotelId: 21,
        name: 'Deluxe',
        minPrice: 500,
        maxPrice: 1500,
      };
      service.search.mockResolvedValue(roomTypes);

      const result = await resolver.searchRoomTypes(searchInput);

      expect(service.search).toHaveBeenCalledWith(searchInput);
      expect(result).toEqual(roomTypes);
    });
  });

  describe('createRoomType mutation', () => {
    it('should create a room type', async () => {
      const input: CreateRoomTypeInput = {
        name: 'Deluxe Suite',
        description: 'A luxurious suite',
        basePrice: 1000,
        maxOccupancy: 3,
        maxAdults: 2,
        maxChildren: 1,
      };
      const createdRoomType = { ...mockRoomType } as RoomType;
      service.create.mockResolvedValue(createdRoomType);

      const result = await resolver.createRoomType(input, 21);

      expect(service.create).toHaveBeenCalledWith(input, 21);
      expect(result).toEqual(createdRoomType);
    });
  });

  describe('updateRoomType mutation', () => {
    it('should update a room type', async () => {
      const input: UpdateRoomTypeInput = {
        name: 'Updated Suite',
        basePrice: 1200,
      };
      const updatedRoomType = { ...mockRoomType, ...input } as RoomType;
      service.update.mockResolvedValue(updatedRoomType);

      const result = await resolver.updateRoomType(1, input, 21);

      expect(service.update).toHaveBeenCalledWith(1, input, 21);
      expect(result).toEqual(updatedRoomType);
    });
  });

  describe('deleteRoomType mutation', () => {
    it('should delete a room type', async () => {
      const deleteResponse = { success: true, message: 'Room type deleted successfully' };
      service.delete.mockResolvedValue(deleteResponse);

      const result = await resolver.deleteRoomType(1, 21);

      expect(service.delete).toHaveBeenCalledWith(1, 21);
      expect(result).toEqual(deleteResponse);
    });
  });

  describe('toggleRoomTypeActiveStatus mutation', () => {
    it('should toggle room type active status to false', async () => {
      const updatedRoomType = { ...mockRoomType, isActive: false } as RoomType;
      service.toggleActiveStatus.mockResolvedValue(updatedRoomType);

      const result = await resolver.toggleRoomTypeActiveStatus(1, false, 21);

      expect(service.toggleActiveStatus).toHaveBeenCalledWith(1, false, 21);
      expect(result).toEqual(updatedRoomType);
    });

    it('should toggle room type active status to true', async () => {
      const updatedRoomType = { ...mockRoomType, isActive: true } as RoomType;
      service.toggleActiveStatus.mockResolvedValue(updatedRoomType);

      const result = await resolver.toggleRoomTypeActiveStatus(1, true, 21);

      expect(service.toggleActiveStatus).toHaveBeenCalledWith(1, true, 21);
      expect(result).toEqual(updatedRoomType);
    });
  });
});
