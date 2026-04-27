import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from '../hotel.service';
import { HotelRepository } from '../hotel.repository';
import { CreateHotelInput, UpdateHotelInput, SearchHotelsInput } from '../dto/hotel.input';
import { CreateHotelWithUrlsInput, UpdateHotelWithUrlsInput } from '../dto/hotel-with-urls.input';
import { DeleteHotelResponse } from '../dto/delete-hotel.response';
import { Hotel } from '../../../database/models/hotel.model';
import { HotelAmenity } from '../../../database/models/hotel-amenity.model';
import { HotelImage } from '../../../database/models/hotel-image.model';
import { GraphQLError } from 'graphql';

describe('HotelService', () => {
  let service: HotelService;
  let mockRepository: jest.Mocked<HotelRepository>;

  const mockHotel = {
    id: 1,
    name: 'Test Hotel',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    phone: '+1234567890',
    email: 'test@hotel.com',
    website: 'www.testhotel.com',
    description: 'A beautiful test hotel',
    latitude: 40.7128,
    longitude: -74.0060,
    rating: 4.5,
    totalReviews: 100,
    isActive: true,
    isVerified: false,
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    amenities: [],
    images: [],
  } as any;

  const mockAmenity = {
    id: 1,
    name: 'WiFi',
    description: 'Free WiFi',
    icon: 'wifi-icon',
    isAvailable: true,
    hotelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockImage = {
    id: 1,
    url: 'https://example.com/image.jpg',
    altText: 'Hotel Image',
    caption: 'Beautiful hotel',
    isPrimary: true,
    sortOrder: 1,
    hotelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      findAll: jest.fn(),
      searchByName: jest.fn(),
      findByOwnerId: jest.fn(),
      search: jest.fn(),
      searchWithElasticsearch: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toggleActiveStatus: jest.fn(),
      count: jest.fn(),
      findNearby: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: HotelRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });


  describe('findById', () => {
    it('should return hotel when valid ID is provided', async () => {
      mockRepository.findById.mockResolvedValue(mockHotel);

      const result = await service.findById(1);

      expect(result).toEqual(mockHotel);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error when ID is invalid', async () => {
      await expect(service.findById(0)).rejects.toThrow('Invalid hotel ID provided');
      await expect(service.findById(-1)).rejects.toThrow('Invalid hotel ID provided');
      await expect(service.findById(null as any)).rejects.toThrow('Invalid hotel ID provided');
    });

    it('should throw error when hotel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Hotel not found');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.findById(1)).rejects.toThrow('Failed to retrieve hotel');
    });
  });

  describe('findAll', () => {
    it('should return all hotels with default pagination', async () => {
      const hotels = [mockHotel];
      mockRepository.findAll.mockResolvedValue(hotels);

      const result = await service.findAll();

      expect(result).toEqual(hotels);
      expect(mockRepository.findAll).toHaveBeenCalledWith(10, 0);
    });

    it('should return hotels with custom pagination', async () => {
      const hotels = [mockHotel];
      mockRepository.findAll.mockResolvedValue(hotels);

      const result = await service.findAll(5, 10);

      expect(result).toEqual(hotels);
      expect(mockRepository.findAll).toHaveBeenCalledWith(5, 10);
    });

    it('should throw error when limit is invalid', async () => {
      await expect(service.findAll(0)).rejects.toThrow('Limit must be between 1 and 100');
      await expect(service.findAll(101)).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error when offset is invalid', async () => {
      await expect(service.findAll(10, -1)).rejects.toThrow('Offset must be non-negative');
    });

    it('should handle repository errors', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('searchByName', () => {
    it('should search hotels by name successfully', async () => {
      const hotels = [mockHotel];
      mockRepository.searchByName.mockResolvedValue(hotels);

      const result = await service.searchByName('Test');

      expect(result).toEqual(hotels);
      expect(mockRepository.searchByName).toHaveBeenCalledWith('Test');
    });

    it('should throw error when search name is empty', async () => {
      await expect(service.searchByName('')).rejects.toThrow('Search name cannot be empty');
      await expect(service.searchByName('   ')).rejects.toThrow('Search name cannot be empty');
    });

    it('should throw error when search name is too short', async () => {
      await expect(service.searchByName('T')).rejects.toThrow('Search name must be at least 2 characters long');
    });

    it('should throw error when search name is too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(service.searchByName(longName)).rejects.toThrow('Search name is too long (max 100 characters)');
    });

    it('should handle repository errors', async () => {
      mockRepository.searchByName.mockRejectedValue(new Error('Database error'));

      await expect(service.searchByName('Test')).rejects.toThrow('Database error');
    });
  });

  describe('findByOwnerId', () => {
    it('should return hotels by owner ID', async () => {
      const hotels = [mockHotel];
      mockRepository.findByOwnerId.mockResolvedValue(hotels);

      const result = await service.findByOwnerId(1);

      expect(result).toEqual(hotels);
      expect(mockRepository.findByOwnerId).toHaveBeenCalledWith(1, 10, 0);
    });

    it('should throw error when owner ID is invalid', async () => {
      await expect(service.findByOwnerId(0)).rejects.toThrow('Invalid owner ID provided');
      await expect(service.findByOwnerId(-1)).rejects.toThrow('Invalid owner ID provided');
    });

    it('should handle repository errors', async () => {
      mockRepository.findByOwnerId.mockRejectedValue(new Error('Database error'));

      await expect(service.findByOwnerId(1)).rejects.toThrow('Failed to retrieve hotels by owner');
    });
  });

  describe('search', () => {
    it('should search hotels with Elasticsearch for text queries', async () => {
      const searchInput: SearchHotelsInput = {
        searchQuery: 'Test Hotel',
        limit: 10,
        offset: 0
      };
      const hotels = [mockHotel];
      mockRepository.searchWithElasticsearch.mockResolvedValue(hotels);

      const result = await service.search(searchInput);

      expect(result).toEqual(hotels);
      expect(mockRepository.searchWithElasticsearch).toHaveBeenCalledWith(searchInput);
    });

    it('should search hotels with SQL for simple queries', async () => {
      const searchInput: SearchHotelsInput = {
        city: 'Test City',
        limit: 10,
        offset: 0
      };
      const hotels = [mockHotel];
      mockRepository.search.mockResolvedValue(hotels);

      const result = await service.search(searchInput);

      expect(result).toEqual(hotels);
      expect(mockRepository.search).toHaveBeenCalledWith(searchInput);
    });

    it('should return all hotels when no search input provided', async () => {
      const hotels = [mockHotel];
      mockRepository.search.mockResolvedValue(hotels);

      const result = await service.search({} as SearchHotelsInput);

      expect(result).toEqual(hotels);
      expect(mockRepository.search).toHaveBeenCalledWith({});
    });

    it('should handle repository errors', async () => {
      const searchInput: SearchHotelsInput = {
        searchQuery: 'Test Hotel',
      };
      mockRepository.searchWithElasticsearch.mockRejectedValue(new Error('Database error'));

      await expect(service.search(searchInput)).rejects.toThrow('Failed to search hotels');
    });
  });


  describe('createWithUrls', () => {
    it('should create hotel with basic data', async () => {
      const input: CreateHotelWithUrlsInput = {
        name: 'Test Hotel',
        description: 'Test Description',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      };

      mockRepository.create.mockResolvedValue(mockHotel);
      mockRepository.findById.mockResolvedValue(mockHotel);

      const result = await service.createWithUrls(input, 1);

      expect(result).toEqual(mockHotel);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Hotel',
          description: 'Test Description',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          ownerId: 1,
        })
      );
    });

    it('should create hotel without images and amenities', async () => {
      const input: CreateHotelWithUrlsInput = {
        name: 'Test Hotel',
        description: 'Test Description',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      };

      mockRepository.create.mockResolvedValue(mockHotel);
      mockRepository.findById.mockResolvedValue(mockHotel);

      const result = await service.createWithUrls(input, 1);

      expect(result).toEqual(mockHotel);
    });

    it('should handle repository errors', async () => {
      const input: CreateHotelWithUrlsInput = {
        name: 'Test Hotel',
        description: 'Test Description',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
      };

      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createWithUrls(input, 1)).rejects.toThrow('Failed to create hotel');
    });
  });

  describe('updateWithUrls', () => {
    it('should update hotel with basic data', async () => {
      const input: UpdateHotelWithUrlsInput = {
        name: 'Updated Hotel',
      };

      const updatedHotel = { ...mockHotel, name: 'Updated Hotel' };
      mockRepository.findById
        .mockResolvedValueOnce(mockHotel)
        .mockResolvedValueOnce(updatedHotel);
      mockRepository.update.mockResolvedValue([1] as any);

      const result = await service.updateWithUrls(1, input, 1);

      expect(result).toEqual(updatedHotel);
      expect(mockRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Hotel' });
    });

    it('should throw error when hotel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateWithUrls(999, { name: 'Test' }, 1)).rejects.toThrow('Hotel not found');
    });

    it('should throw error when user is not owner', async () => {
      const otherHotel = { ...mockHotel, ownerId: 2 };
      mockRepository.findById.mockResolvedValue(otherHotel);

      await expect(service.updateWithUrls(1, { name: 'Test' }, 1)).rejects.toThrow('You can only modify your own hotels');
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete hotel successfully', async () => {
      const deletedHotel = { ...mockHotel, deletedAt: new Date() };
      mockRepository.findById.mockResolvedValue(mockHotel);
      mockRepository.delete.mockResolvedValue(undefined);
      mockRepository.findByIdIncludingDeleted.mockResolvedValue(deletedHotel);

      const result: DeleteHotelResponse = await service.delete(1, 1);

      expect(result).toEqual({
        success: true,
        message: 'Hotel deleted successfully',
        hotel: deletedHotel,
      });
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockRepository.findByIdIncludingDeleted).toHaveBeenCalledWith(1);
    });

    it('should throw error when hotel ID is invalid', async () => {
      await expect(service.delete(0, 1)).rejects.toThrow('Invalid hotel ID provided');
    });

    it('should throw error when owner ID is invalid', async () => {
      await expect(service.delete(1, 0)).rejects.toThrow('Invalid owner ID provided');
    });

    it('should throw error when hotel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999, 1)).rejects.toThrow('Hotel not found');
    });

    it('should throw error when user is not owner', async () => {
      const otherHotel = { ...mockHotel, ownerId: 2 };
      mockRepository.findById.mockResolvedValue(otherHotel);

      await expect(service.delete(1, 1)).rejects.toThrow('You can only delete your own hotels');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockResolvedValue(mockHotel);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.delete(1, 1)).rejects.toThrow('Failed to delete hotel');
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle hotel active status successfully', async () => {
      const updatedHotel = { ...mockHotel, isActive: false };
      mockRepository.findById.mockResolvedValue(mockHotel);
      mockRepository.toggleActiveStatus.mockResolvedValue(undefined);
      mockRepository.findById.mockResolvedValue(updatedHotel);

      const result = await service.toggleActiveStatus(1, false, 1);

      expect(result).toEqual(updatedHotel);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.toggleActiveStatus).toHaveBeenCalledWith(1, false);
    });

    it('should throw error when hotel ID is invalid', async () => {
      await expect(service.toggleActiveStatus(0, true, 1)).rejects.toThrow('Invalid hotel ID provided');
    });

    it('should throw error when owner ID is invalid', async () => {
      await expect(service.toggleActiveStatus(1, true, 0)).rejects.toThrow('Invalid owner ID provided');
    });

    it('should throw error when hotel not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.toggleActiveStatus(999, true, 1)).rejects.toThrow('Hotel not found');
    });

    it('should throw error when user is not owner', async () => {
      const otherHotel = { ...mockHotel, ownerId: 2 };
      mockRepository.findById.mockResolvedValue(otherHotel);

      await expect(service.toggleActiveStatus(1, true, 1)).rejects.toThrow('You can only modify your own hotels');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockResolvedValue(mockHotel);
      mockRepository.toggleActiveStatus.mockRejectedValue(new Error('Database error'));

      await expect(service.toggleActiveStatus(1, true, 1)).rejects.toThrow('Failed to toggle hotel status');
    });
  });

  describe('count', () => {
    it('should return total count of hotels', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.count()).rejects.toThrow('Failed to count hotels');
    });
  });

  describe('findNearby', () => {
    it('should find nearby hotels successfully', async () => {
      const hotels = [mockHotel];
      mockRepository.findNearby.mockResolvedValue(hotels);

      const result = await service.findNearby(40.7128, -74.0060, 10);

      expect(result).toEqual(hotels);
      expect(mockRepository.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 10);
    });

    it('should use default radius when not provided', async () => {
      const hotels = [mockHotel];
      mockRepository.findNearby.mockResolvedValue(hotels);

      const result = await service.findNearby(40.7128, -74.0060);

      expect(result).toEqual(hotels);
      expect(mockRepository.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 10);
    });

    it('should handle repository errors', async () => {
      mockRepository.findNearby.mockRejectedValue(new Error('Database error'));

      await expect(service.findNearby(40.7128, -74.0060, 10)).rejects.toThrow('Failed to search nearby hotels');
    });
  });
});
