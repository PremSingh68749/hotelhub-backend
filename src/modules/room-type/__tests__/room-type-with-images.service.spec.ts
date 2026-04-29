import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { RoomTypeWithImagesService } from '../room-type-with-images.service';
import { RoomTypeRepository } from '../room-type.repository';
import { HotelRepository } from '../../hotel/hotel.repository';
import { FileUploadService } from '../../../common/services/file-upload.service';
import { RoomType } from '../../../database/models/room-type.model';
import { RoomTypeImage } from '../../../database/models/room-type-image.model';
import { CreateRoomTypeWithImagesInput, UpdateRoomTypeWithImagesInput } from '../dto/room-type-with-images.input';

jest.mock('../../../database/models/room-type-image.model', () => ({
  RoomTypeImage: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('RoomTypeWithImagesService', () => {
  let service: RoomTypeWithImagesService;
  let roomTypeRepository: jest.Mocked<RoomTypeRepository>;
  let hotelRepository: jest.Mocked<HotelRepository>;
  let fileUploadService: jest.Mocked<FileUploadService>;

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
    images: '["image1.jpg"]',
    isActive: true,
    hotelId: 21,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockHotel = {
    id: 21,
    name: 'Test Hotel',
    ownerId: 1,
  };

  const mockRoomTypeRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockHotelRepository = {
    findById: jest.fn(),
  };

  const mockFileUploadService = {
    uploadMultipleFiles: jest.fn(),
    deleteMultipleFiles: jest.fn(),
    extractPublicIdFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeWithImagesService,
        {
          provide: RoomTypeRepository,
          useValue: mockRoomTypeRepository,
        },
        {
          provide: HotelRepository,
          useValue: mockHotelRepository,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    service = module.get<RoomTypeWithImagesService>(RoomTypeWithImagesService);
    roomTypeRepository = module.get(RoomTypeRepository);
    hotelRepository = module.get(HotelRepository);
    fileUploadService = module.get(FileUploadService);

    jest.clearAllMocks();
  });

  describe('createWithImages', () => {
    const validInput: CreateRoomTypeWithImagesInput = {
      hotelId: 21,
      name: 'Deluxe Suite',
      description: 'A luxurious suite',
      basePrice: 1000,
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 1,
      amenities: '["WiFi", "TV"]',
      images: ['image1.jpg'],
    };

    it('should create room type without images successfully', async () => {
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.create.mockResolvedValue(mockRoomType as any);
      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);

      const result = await service.createWithImages(validInput, 1);

      expect(hotelRepository.findById).toHaveBeenCalledWith(21);
      expect(roomTypeRepository.create).toHaveBeenCalledWith({
        hotelId: 21,
        name: 'Deluxe Suite',
        description: 'A luxurious suite',
        basePrice: 1000,
        maxOccupancy: 3,
        adults: 2,
        children: 1,
        numberOfBeds: undefined,
        bedType: undefined,
        roomSize: undefined,
        amenities: '["WiFi", "TV"]',
        images: JSON.stringify(['image1.jpg']),
      });
      expect(result).toEqual(mockRoomType);
    });

    it('should throw NotFoundException when hotel not found', async () => {
      hotelRepository.findById.mockResolvedValue(null);

      await expect(service.createWithImages(validInput, 1)).rejects.toThrow(NotFoundException);
      await expect(service.createWithImages(validInput, 1)).rejects.toThrow('Hotel not found');
    });

    it('should throw ForbiddenException when user does not own hotel', async () => {
      const differentOwnerHotel = { ...mockHotel, ownerId: 99 };
      hotelRepository.findById.mockResolvedValue(differentOwnerHotel as any);

      await expect(service.createWithImages(validInput, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.createWithImages(validInput, 1)).rejects.toThrow('You can only create room types for your own hotels');
    });

    it('should handle image uploads when provided', async () => {
      const inputWithImages: CreateRoomTypeWithImagesInput = {
        ...validInput,
        imageUpload: {
          files: [{ filename: 'test.jpg' }] as any,
          imageData: [{ altText: 'Test image', isPrimary: true }],
        },
      };

      const uploadResults = [
        { secureUrl: 'https://cloudinary.com/image1.jpg', url: 'https://cloudinary.com/image1.jpg', publicId: 'public-id-1' },
      ];

      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.create.mockResolvedValue(mockRoomType as any);
      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      fileUploadService.uploadMultipleFiles.mockResolvedValue(uploadResults);
      fileUploadService.extractPublicIdFromUrl.mockReturnValue('public-id-1');
      (RoomTypeImage.create as jest.Mock).mockResolvedValue({});
      (RoomTypeImage.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.createWithImages(inputWithImages, 1);

      expect(fileUploadService.uploadMultipleFiles).toHaveBeenCalledWith(
        [{ filename: 'test.jpg' }],
        'ROOM_TYPES'
      );
      expect(RoomTypeImage.create).toHaveBeenCalled();
      expect(result).toEqual(mockRoomType);
    });

    it('should handle null amenities and images', async () => {
      const inputWithoutAmenities: CreateRoomTypeWithImagesInput = {
        ...validInput,
        amenities: undefined,
        images: undefined,
      };

      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.create.mockResolvedValue(mockRoomType as any);
      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);

      await service.createWithImages(inputWithoutAmenities, 1);

      expect(roomTypeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amenities: null,
          images: null,
        })
      );
    });

    it('should throw GraphQLError on repository error', async () => {
      hotelRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.createWithImages(validInput, 1)).rejects.toThrow(GraphQLError);
    });
  });

  describe('updateWithImages', () => {
    const validUpdateInput: UpdateRoomTypeWithImagesInput = {
      name: 'Updated Suite',
      basePrice: 1200,
    };

    it('should update room type successfully', async () => {
      const updatedRoomType = { ...mockRoomType, name: 'Updated Suite', basePrice: 1200 };

      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.update.mockResolvedValue(updatedRoomType as any);

      const result = await service.updateWithImages(1, validUpdateInput, 1);

      expect(roomTypeRepository.findById).toHaveBeenCalledWith(1);
      expect(hotelRepository.findById).toHaveBeenCalledWith(21);
      expect(roomTypeRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(updatedRoomType);
    });

    it('should throw NotFoundException when room type not found', async () => {
      roomTypeRepository.findById.mockResolvedValue(null);

      await expect(service.updateWithImages(999, validUpdateInput, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own hotel', async () => {
      const differentOwnerHotel = { ...mockHotel, ownerId: 99 };
      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(differentOwnerHotel as any);

      await expect(service.updateWithImages(1, validUpdateInput, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should handle new image uploads', async () => {
      const inputWithNewImages: UpdateRoomTypeWithImagesInput = {
        ...validUpdateInput,
        newImages: {
          files: [{ filename: 'new.jpg' }] as any,
          imageData: [{ altText: 'New image' }],
        },
      };

      const uploadResults = [
        { secureUrl: 'https://cloudinary.com/new.jpg', url: 'https://cloudinary.com/new.jpg', publicId: 'public-id-new' },
      ];

      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.update.mockResolvedValue(mockRoomType as any);
      fileUploadService.uploadMultipleFiles.mockResolvedValue(uploadResults);
      fileUploadService.extractPublicIdFromUrl.mockReturnValue('public-id-new');
      (RoomTypeImage.create as jest.Mock).mockResolvedValue({});
      (RoomTypeImage.findAll as jest.Mock).mockResolvedValue([]);

      await service.updateWithImages(1, inputWithNewImages, 1);

      expect(fileUploadService.uploadMultipleFiles).toHaveBeenCalled();
    });

    it('should handle image deletions', async () => {
      const inputWithDeleteImages: UpdateRoomTypeWithImagesInput = {
        ...validUpdateInput,
        deleteImageIds: [1, 2, 3],
      };

      const existingImages = [
        { id: 1, publicId: 'public-1', update: jest.fn() },
        { id: 2, publicId: 'public-2', update: jest.fn() },
      ];

      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.update.mockResolvedValue(mockRoomType as any);
      (RoomTypeImage.findAll as jest.Mock).mockResolvedValue(existingImages);
      fileUploadService.deleteMultipleFiles.mockResolvedValue(undefined);
      (RoomTypeImage.destroy as jest.Mock).mockResolvedValue(2);

      await service.updateWithImages(1, inputWithDeleteImages, 1);

      expect(fileUploadService.deleteMultipleFiles).toHaveBeenCalledWith(['public-1', 'public-2']);
      expect(RoomTypeImage.destroy).toHaveBeenCalledWith({ where: { id: [1, 2, 3] } });
    });

    it('should map maxAdults and maxChildren to adults and children', async () => {
      const inputWithMaxValues: UpdateRoomTypeWithImagesInput = {
        maxAdults: 4,
        maxChildren: 2,
      };

      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.update.mockResolvedValue(mockRoomType as any);

      await service.updateWithImages(1, inputWithMaxValues, 1);

      expect(roomTypeRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          adults: 4,
          children: 2,
        })
      );
    });

    it('should handle string amenities correctly', async () => {
      const inputWithAmenities: UpdateRoomTypeWithImagesInput = {
        amenities: '["Pool", "Gym"]',
      };

      roomTypeRepository.findById.mockResolvedValue(mockRoomType as any);
      hotelRepository.findById.mockResolvedValue(mockHotel as any);
      roomTypeRepository.update.mockResolvedValue(mockRoomType as any);

      await service.updateWithImages(1, inputWithAmenities, 1);

      expect(roomTypeRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          amenities: JSON.stringify(['"Pool"', '"Gym"']),
        })
      );
    });
  });
});
