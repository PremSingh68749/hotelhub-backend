import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { RoomTypeWithImagesResolver } from '../room-type-with-images.resolver';
import { RoomTypeWithImagesService } from '../room-type-with-images.service';
import { RoomType } from '../../../database/models/room-type.model';
import { CreateRoomTypeWithImagesInput, UpdateRoomTypeWithImagesInput } from '../dto/room-type-with-images.input';
import { UserTokenPayload } from '../../../common/constants/app.constant';

describe('RoomTypeWithImagesResolver', () => {
  let resolver: RoomTypeWithImagesResolver;
  let service: jest.Mocked<RoomTypeWithImagesService>;

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

  const mockUser: UserTokenPayload = {
    sub: 1,
    email: 'owner@hotel.com',
    name: 'Hotel Owner',
  };

  const mockRoomTypeWithImagesService = {
    createWithImages: jest.fn(),
    updateWithImages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeWithImagesResolver,
        {
          provide: RoomTypeWithImagesService,
          useValue: mockRoomTypeWithImagesService,
        },
      ],
    }).compile();

    resolver = module.get<RoomTypeWithImagesResolver>(RoomTypeWithImagesResolver);
    service = module.get(RoomTypeWithImagesService);

    jest.clearAllMocks();
  });

  describe('createRoomTypeWithImages mutation', () => {
    it('should create room type with images', async () => {
      const input: CreateRoomTypeWithImagesInput = {
        hotelId: 21,
        name: 'Deluxe Suite',
        description: 'A luxurious suite',
        basePrice: 1000,
        maxOccupancy: 3,
        maxAdults: 2,
        maxChildren: 1,
        amenities: '["WiFi", "TV"]',
        images: ['image1.jpg'],
        imageUpload: {
          files: [{ filename: 'test.jpg' }] as any,
          imageData: [{ altText: 'Test image', isPrimary: true }],
        },
      };

      const createdRoomType = { ...mockRoomType } as RoomType;
      service.createWithImages.mockResolvedValue(createdRoomType);

      const result = await resolver.createRoomTypeWithImages(input, mockUser);

      expect(service.createWithImages).toHaveBeenCalledWith(input, mockUser.sub);
      expect(result).toEqual(createdRoomType);
    });

    it('should create room type without images', async () => {
      const input: CreateRoomTypeWithImagesInput = {
        hotelId: 21,
        name: 'Standard Room',
        basePrice: 500,
        maxOccupancy: 2,
        maxAdults: 2,
      };

      const createdRoomType = { ...mockRoomType, id: 2, name: 'Standard Room' } as RoomType;
      service.createWithImages.mockResolvedValue(createdRoomType);

      const result = await resolver.createRoomTypeWithImages(input, mockUser);

      expect(service.createWithImages).toHaveBeenCalledWith(input, mockUser.sub);
      expect(result).toEqual(createdRoomType);
    });

    it('should use correct user sub from auth token', async () => {
      const input: CreateRoomTypeWithImagesInput = {
        hotelId: 21,
        name: 'Test Room',
        basePrice: 800,
        maxOccupancy: 2,
        maxAdults: 2,
      };

      const userWithDifferentId: UserTokenPayload = {
        ...mockUser,
        sub: 99,
      };

      service.createWithImages.mockResolvedValue(mockRoomType as RoomType);

      await resolver.createRoomTypeWithImages(input, userWithDifferentId);

      expect(service.createWithImages).toHaveBeenCalledWith(input, 99);
    });
  });

  describe('updateRoomTypeWithImages mutation', () => {
    it('should update room type with images', async () => {
      const id = 1;
      const input: UpdateRoomTypeWithImagesInput = {
        name: 'Updated Suite',
        basePrice: 1200,
        newImages: {
          files: [{ filename: 'new.jpg' }] as any,
          imageData: [{ altText: 'New image' }],
        },
        deleteImageIds: [1, 2],
      };

      const updatedRoomType = { ...mockRoomType, name: 'Updated Suite', basePrice: 1200 } as RoomType;
      service.updateWithImages.mockResolvedValue(updatedRoomType);

      const result = await resolver.updateRoomTypeWithImages(id, input, mockUser);

      expect(service.updateWithImages).toHaveBeenCalledWith(id, input, mockUser.sub);
      expect(result).toEqual(updatedRoomType);
    });

    it('should update room type without image changes', async () => {
      const id = 1;
      const input: UpdateRoomTypeWithImagesInput = {
        name: 'Updated Name Only',
      };

      const updatedRoomType = { ...mockRoomType, name: 'Updated Name Only' } as RoomType;
      service.updateWithImages.mockResolvedValue(updatedRoomType);

      const result = await resolver.updateRoomTypeWithImages(id, input, mockUser);

      expect(service.updateWithImages).toHaveBeenCalledWith(id, input, mockUser.sub);
      expect(result).toEqual(updatedRoomType);
    });

    it('should pass correct room type id to service', async () => {
      const roomTypeId = 42;
      const input: UpdateRoomTypeWithImagesInput = {
        isActive: false,
      };

      service.updateWithImages.mockResolvedValue(mockRoomType as RoomType);

      await resolver.updateRoomTypeWithImages(roomTypeId, input, mockUser);

      expect(service.updateWithImages).toHaveBeenCalledWith(42, input, mockUser.sub);
    });
  });
});
