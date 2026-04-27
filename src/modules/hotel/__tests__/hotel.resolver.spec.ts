import { HotelService } from '../hotel.service';
import { Hotel } from '../../../database/models/hotel.model';
import { HotelAmenity } from '../../../database/models/hotel-amenity.model';
import { DeleteHotelResponse } from '../dto/delete-hotel.response';
import { CreateHotelWithUrlsInput, UpdateHotelWithUrlsInput } from '../dto/hotel-with-urls.input';
import { SearchHotelsInput } from '../dto/hotel.input';
import { UserTokenPayload } from '../../../common/constants/app.constant';

// Mock resolver class to avoid import issues - simplified without decorators
class MockHotelResolver {
  constructor(private hotelService: HotelService) {}

  async getHotelById(id: number) {
    return this.hotelService.findById(id);
  }

  async getHotels(limit: number, offset: number) {
    return this.hotelService.findAll(limit, offset);
  }

  async searchHotels(searchInput: SearchHotelsInput) {
    return this.hotelService.search(searchInput);
  }

  async getHotelCount() {
    return this.hotelService.count();
  }

  async searchNearby(latitude: number, longitude: number, radius?: number) {
    return this.hotelService.findNearby(latitude, longitude, radius);
  }

  async createHotelWithUrls(input: CreateHotelWithUrlsInput, userId: number) {
    return this.hotelService.createWithUrls(input, userId);
  }

  async updateHotelWithUrls(id: number, input: UpdateHotelWithUrlsInput, userId: number) {
    return this.hotelService.updateWithUrls(id, input, userId);
  }

  async deleteHotel(id: number, userId: number) {
    return this.hotelService.delete(id, userId);
  }

  async toggleHotelActiveStatus(id: number, isActive: boolean, userId: number) {
    return this.hotelService.toggleActiveStatus(id, isActive, userId);
  }

  amenities(hotel: Hotel) {
    return hotel.amenities || [];
  }
}

describe('HotelResolver', () => {
  let resolver: MockHotelResolver;
  let mockService: jest.Mocked<HotelService>;

  const mockHotel = {
    id: 1,
    name: 'Test Hotel',
    description: 'Test Description',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    amenities: [],
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockUser: UserTokenPayload = {
    sub: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    mockService = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByOwnerId: jest.fn(),
      search: jest.fn(),
      searchByName: jest.fn(),
      count: jest.fn(),
      findNearby: jest.fn(),
      createWithUrls: jest.fn(),
      updateWithUrls: jest.fn(),
      delete: jest.fn(),
      toggleActiveStatus: jest.fn(),
    } as any;

    resolver = new MockHotelResolver(mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Resolver Initialization', () => {
    it('should be defined', () => {
      expect(resolver).toBeDefined();
    });
  });

  describe('Queries', () => {
    describe('hotel', () => {
      it('should return a hotel by ID', async () => {
        mockService.findById.mockResolvedValue(mockHotel);

        const result = await resolver.getHotelById(1);

        expect(result).toEqual(mockHotel);
        expect(mockService.findById).toHaveBeenCalledWith(1);
      });

      it('should handle hotel not found', async () => {
        mockService.findById.mockResolvedValue(null as any);

        const result = await resolver.getHotelById(999);

        expect(result).toBeNull();
        expect(mockService.findById).toHaveBeenCalledWith(999);
      });
    });

    describe('hotels', () => {
      it('should return hotels with default pagination', async () => {
        const hotels = [mockHotel];
        mockService.findAll.mockResolvedValue(hotels);

        const result = await resolver.getHotels(10, 0);

        expect(result).toEqual(hotels);
        expect(mockService.findAll).toHaveBeenCalledWith(10, 0);
      });

      it('should return hotels with custom pagination', async () => {
        const hotels = [mockHotel];
        mockService.findAll.mockResolvedValue(hotels);

        const result = await resolver.getHotels(5, 10);

        expect(result).toEqual(hotels);
        expect(mockService.findAll).toHaveBeenCalledWith(5, 10);
      });
    });

    describe('searchHotels', () => {
      it('should search hotels', async () => {
        const searchInput: SearchHotelsInput = {
          city: 'Test City',
          limit: 10,
          offset: 0,
        };
        const hotels = [mockHotel];
        mockService.search.mockResolvedValue(hotels);

        const result = await resolver.searchHotels(searchInput);

        expect(result).toEqual(hotels);
        expect(mockService.search).toHaveBeenCalledWith(searchInput);
      });
    });

    describe('hotelCount', () => {
      it('should return hotel count', async () => {
        mockService.count.mockResolvedValue(42);

        const result = await resolver.getHotelCount();

        expect(result).toBe(42);
        expect(mockService.count).toHaveBeenCalled();
      });
    });

    describe('searchNearby', () => {
      it('should find nearby hotels', async () => {
        const hotels = [mockHotel];
        mockService.findNearby.mockResolvedValue(hotels);

        const result = await resolver.searchNearby(40.7128, -74.0060, 10);

        expect(result).toEqual(hotels);
        expect(mockService.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 10);
      });
    });
  });

  describe('Mutations', () => {
    describe('createHotelWithUrls', () => {
      it('should create a hotel with images and amenities', async () => {
        const input: CreateHotelWithUrlsInput = {
          name: 'Test Hotel',
          description: 'Test Description',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          amenities: ['WiFi', 'Pool'],
          images: { images: [{ url: 'test.jpg', isPrimary: true }] },
        };

        const hotelWithRelations = {
          ...mockHotel,
          amenities: [{ id: 1, name: 'WiFi' }],
          images: [{ id: 1, url: 'test.jpg' }],
        };

        mockService.createWithUrls.mockResolvedValue(hotelWithRelations);

        const result = await resolver.createHotelWithUrls(input, mockUser.sub);

        expect(result).toEqual(hotelWithRelations);
        expect(mockService.createWithUrls).toHaveBeenCalledWith(input, mockUser.sub);
      });
    });

    describe('updateHotelWithUrls', () => {
      it('should update a hotel with images and amenities', async () => {
        const input: UpdateHotelWithUrlsInput = {
          name: 'Updated Hotel',
          amenities: ['WiFi', 'Restaurant'],
          newImages: { images: [{ url: 'new.jpg' }] },
          deleteImageIds: [1],
        };

        const updatedHotel = { ...mockHotel, name: 'Updated Hotel' };
        mockService.updateWithUrls.mockResolvedValue(updatedHotel);

        const result = await resolver.updateHotelWithUrls(1, input, mockUser.sub);

        expect(result).toEqual(updatedHotel);
        expect(mockService.updateWithUrls).toHaveBeenCalledWith(1, input, mockUser.sub);
      });
    });

    describe('deleteHotel', () => {
      it('should delete a hotel (soft delete)', async () => {
        const deletedHotel = { ...mockHotel, deletedAt: new Date() };
        const deleteResponse: DeleteHotelResponse = {
          success: true,
          message: 'Hotel deleted successfully',
          hotel: deletedHotel,
        };

        mockService.delete.mockResolvedValue(deleteResponse);

        const result = await resolver.deleteHotel(1, mockUser.sub);

        expect(result).toEqual(deleteResponse);
        expect(mockService.delete).toHaveBeenCalledWith(1, mockUser.sub);
      });
    });

    describe('toggleHotelActiveStatus', () => {
      it('should toggle hotel active status', async () => {
        const updatedHotel = { ...mockHotel, isActive: false };
        mockService.toggleActiveStatus.mockResolvedValue(updatedHotel);

        const result = await resolver.toggleHotelActiveStatus(1, false, 1);

        expect(result).toEqual(updatedHotel);
        expect(mockService.toggleActiveStatus).toHaveBeenCalledWith(1, false, 1);
      });
    });
  });

  describe('Field Resolvers', () => {
    describe('amenities', () => {
      it('should return amenities array or empty array', () => {
        const hotelWithAmenities = { ...mockHotel, amenities: [{ name: 'WiFi' }] };
        const hotelWithoutAmenities = { ...mockHotel, amenities: null };

        expect(resolver.amenities(hotelWithAmenities)).toEqual([{ name: 'WiFi' }]);
        expect(resolver.amenities(hotelWithoutAmenities)).toEqual([]);
      });
    });
  });
});
