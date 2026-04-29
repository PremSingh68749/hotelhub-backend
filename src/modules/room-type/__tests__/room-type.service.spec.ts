import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { RoomTypeService } from '../room-type.service';
import { RoomTypeRepository } from '../room-type.repository';
import { RoomType } from '../../../database/models/room-type.model';
import { CreateRoomTypeInput, UpdateRoomTypeInput } from '../dto/room-type.input';

describe('RoomTypeService', () => {
  let service: RoomTypeService;
  let repository: jest.Mocked<RoomTypeRepository>;

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

  const mockRoomTypeRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByHotelId: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeService,
        {
          provide: RoomTypeRepository,
          useValue: mockRoomTypeRepository,
        },
      ],
    }).compile();

    service = module.get<RoomTypeService>(RoomTypeService);
    repository = module.get(RoomTypeRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const validInput: CreateRoomTypeInput = {
      name: 'Deluxe Suite',
      description: 'A luxurious suite',
      basePrice: 1000,
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 1,
      numberOfBeds: 1,
      bedType: 'King',
      roomSize: 800,
      amenities: '["WiFi", "TV"]',
      images: ['image1.jpg', 'image2.jpg'],
    };

    it('should create a room type successfully', async () => {
      const hotelId = 21;
      const createdRoomType = { ...mockRoomType } as RoomType;
      repository.create.mockResolvedValue(createdRoomType);

      const result = await service.create(validInput, hotelId);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Deluxe Suite',
        description: 'A luxurious suite',
        basePrice: 1000,
        maxOccupancy: 3,
        numberOfBeds: 1,
        bedType: 'King',
        roomSize: 800,
        hotelId,
        isActive: true,
        adults: 2,
        children: 1,
        amenities: '["WiFi", "TV"]',
        images: JSON.stringify(['image1.jpg', 'image2.jpg']),
      });
      expect(result).toEqual(createdRoomType);
    });

    it('should throw GraphQLError when name is empty', async () => {
      const invalidInput = { ...validInput, name: '   ' };

      await expect(service.create(invalidInput, 21)).rejects.toThrow(GraphQLError);
      await expect(service.create(invalidInput, 21)).rejects.toThrow('Room type name is required');
    });

    it('should throw GraphQLError when name is not provided', async () => {
      const invalidInput = { ...validInput, name: undefined as any };

      await expect(service.create(invalidInput, 21)).rejects.toThrow(GraphQLError);
    });

    it('should throw GraphQLError when basePrice is 0', async () => {
      const invalidInput = { ...validInput, basePrice: 0 };

      await expect(service.create(invalidInput, 21)).rejects.toThrow(GraphQLError);
      await expect(service.create(invalidInput, 21)).rejects.toThrow('Base price must be greater than 0');
    });

    it('should throw GraphQLError when maxOccupancy is 0', async () => {
      const invalidInput = { ...validInput, maxOccupancy: 0 };

      await expect(service.create(invalidInput, 21)).rejects.toThrow(GraphQLError);
      await expect(service.create(invalidInput, 21)).rejects.toThrow('Max occupancy must be greater than 0');
    });

    it('should handle null amenities and images', async () => {
      const inputWithoutArrays: CreateRoomTypeInput = {
        ...validInput,
        amenities: undefined,
        images: undefined,
      };
      const createdRoomType = { ...mockRoomType } as RoomType;
      repository.create.mockResolvedValue(createdRoomType);

      await service.create(inputWithoutArrays, 21);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amenities: null,
          images: null,
        })
      );
    });

    it('should default maxChildren to 0 when not provided', async () => {
      const inputWithoutChildren: CreateRoomTypeInput = {
        ...validInput,
        maxChildren: undefined,
      };
      const createdRoomType = { ...mockRoomType } as RoomType;
      repository.create.mockResolvedValue(createdRoomType);

      await service.create(inputWithoutChildren, 21);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          children: 0,
        })
      );
    });

    it('should trim name and description', async () => {
      const inputWithWhitespace: CreateRoomTypeInput = {
        ...validInput,
        name: '  Deluxe Suite  ',
        description: '  A luxurious suite  ',
      };
      const createdRoomType = { ...mockRoomType } as RoomType;
      repository.create.mockResolvedValue(createdRoomType);

      await service.create(inputWithWhitespace, 21);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Deluxe Suite',
          description: 'A luxurious suite',
        })
      );
    });

    it('should use empty string when description is not provided', async () => {
      const inputWithoutDescription: CreateRoomTypeInput = {
        ...validInput,
        description: undefined,
      };
      const createdRoomType = { ...mockRoomType } as RoomType;
      repository.create.mockResolvedValue(createdRoomType);

      await service.create(inputWithoutDescription, 21);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        })
      );
    });
  });

  describe('findById', () => {
    it('should return room type by id', async () => {
      const roomType = { ...mockRoomType } as RoomType;
      repository.findById.mockResolvedValue(roomType);

      const result = await service.findById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(roomType);
    });

    it('should throw NotFoundException when room type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow('Room type not found');
    });

    it('should throw GraphQLError on repository error', async () => {
      repository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.findById(1)).rejects.toThrow(GraphQLError);
      await expect(service.findById(1)).rejects.toThrow('Failed to retrieve room type');
    });
  });

  describe('findByHotelId', () => {
    it('should return room types for hotel', async () => {
      const roomTypes = [{ ...mockRoomType }, { ...mockRoomType, id: 2, name: 'Standard Room' }] as RoomType[];
      repository.findByHotelId.mockResolvedValue(roomTypes);

      const result = await service.findByHotelId(21);

      expect(repository.findByHotelId).toHaveBeenCalledWith(21);
      expect(result).toEqual(roomTypes);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no room types found', async () => {
      repository.findByHotelId.mockResolvedValue([]);

      const result = await service.findByHotelId(999);

      expect(result).toEqual([]);
    });

    it('should throw GraphQLError on repository error', async () => {
      repository.findByHotelId.mockRejectedValue(new Error('Database error'));

      await expect(service.findByHotelId(21)).rejects.toThrow(GraphQLError);
      await expect(service.findByHotelId(21)).rejects.toThrow('Failed to retrieve room types');
    });
  });

  describe('search', () => {
    const searchInput = {
      hotelId: 21,
      name: 'Deluxe',
      minPrice: 500,
      maxPrice: 1500,
      minOccupancy: 2,
      maxOccupancy: 4,
      amenities: ['WiFi', 'TV'],
      isActive: true,
      limit: 10,
      offset: 0,
    };

    it('should search room types with filters', async () => {
      const roomTypes = [{ ...mockRoomType }] as RoomType[];
      repository.search.mockResolvedValue(roomTypes);

      const result = await service.search(searchInput);

      expect(repository.search).toHaveBeenCalledWith(searchInput);
      expect(result).toEqual(roomTypes);
    });

    it('should throw GraphQLError on repository error', async () => {
      repository.search.mockRejectedValue(new Error('Database error'));

      await expect(service.search(searchInput)).rejects.toThrow(GraphQLError);
      await expect(service.search(searchInput)).rejects.toThrow('Failed to search room types');
    });
  });

  describe('update', () => {
    const updateInput: UpdateRoomTypeInput = {
      name: 'Updated Suite',
      description: 'Updated description',
      basePrice: 1200,
      maxAdults: 3,
      maxChildren: 2,
      amenities: '["WiFi", "Pool"]',
      images: ['new-image.jpg'],
    };

    it('should update room type successfully', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      const updatedRoomType = { ...mockRoomType, ...updateInput, adults: 3, children: 2 } as RoomType;

      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockResolvedValue(updatedRoomType);

      const result = await service.update(1, updateInput, 21);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Updated Suite',
          description: 'Updated description',
          basePrice: 1200,
          adults: 3,
          children: 2,
          amenities: JSON.stringify(['"WiFi"', '"Pool"']),
          images: JSON.stringify(['new-image.jpg']),
        })
      );
      expect(result).toEqual(updatedRoomType);
    });

    it('should throw NotFoundException when room type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(999, updateInput, 21)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when hotelId does not match', async () => {
      const existingRoomType = { ...mockRoomType, hotelId: 99 } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);

      await expect(service.update(1, updateInput, 21)).rejects.toThrow(ForbiddenException);
      await expect(service.update(1, updateInput, 21)).rejects.toThrow('You can only update room types for your own hotels');
    });

    it('should only update adults when maxAdults is provided', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      const partialUpdate: UpdateRoomTypeInput = { name: 'Updated Name' };
      const updatedRoomType = { ...mockRoomType, name: 'Updated Name' } as RoomType;

      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockResolvedValue(updatedRoomType);

      await service.update(1, partialUpdate, 21);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({
          adults: expect.any(Number),
          children: expect.any(Number),
        })
      );
    });

    it('should preserve existing amenities and images when not provided', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      const partialUpdate: UpdateRoomTypeInput = { name: 'Updated Name' };
      const updatedRoomType = { ...mockRoomType, name: 'Updated Name' } as RoomType;

      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockResolvedValue(updatedRoomType);

      await service.update(1, partialUpdate, 21);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          amenities: existingRoomType.amenities,
          images: existingRoomType.images,
        })
      );
    });

    it('should use existing name when new name is not provided', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      const partialUpdate: UpdateRoomTypeInput = { basePrice: 1500 };
      const updatedRoomType = { ...mockRoomType, basePrice: 1500 } as RoomType;

      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockResolvedValue(updatedRoomType);

      await service.update(1, partialUpdate, 21);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: existingRoomType.name,
        })
      );
    });

    it('should throw GraphQLError on repository error', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update(1, updateInput, 21)).rejects.toThrow(GraphQLError);
    });
  });

  describe('delete', () => {
    it('should delete room type successfully', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);
      repository.delete.mockResolvedValue(undefined);

      const result = await service.delete(1, 21);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        message: 'Room type deleted successfully',
      });
    });

    it('should throw NotFoundException when room type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(999, 21)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when hotelId does not match', async () => {
      const existingRoomType = { ...mockRoomType, hotelId: 99 } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);

      await expect(service.delete(1, 21)).rejects.toThrow(ForbiddenException);
    });

    it('should throw GraphQLError on repository error', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);
      repository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.delete(1, 21)).rejects.toThrow(GraphQLError);
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle room type active status', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      const updatedRoomType = { ...mockRoomType, isActive: false } as RoomType;

      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockResolvedValue(updatedRoomType);

      const result = await service.toggleActiveStatus(1, false, 21);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(result).toEqual(updatedRoomType);
    });

    it('should throw NotFoundException when room type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.toggleActiveStatus(999, false, 21)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when hotelId does not match', async () => {
      const existingRoomType = { ...mockRoomType, hotelId: 99 } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);

      await expect(service.toggleActiveStatus(1, false, 21)).rejects.toThrow(ForbiddenException);
    });

    it('should throw GraphQLError on repository error', async () => {
      const existingRoomType = { ...mockRoomType } as RoomType;
      repository.findById.mockResolvedValue(existingRoomType);
      repository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.toggleActiveStatus(1, false, 21)).rejects.toThrow(GraphQLError);
    });
  });
});
