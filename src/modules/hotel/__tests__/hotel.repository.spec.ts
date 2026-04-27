import { HotelRepository } from '../hotel.repository';
import { Hotel } from '../../../database/models/hotel.model';
import { HotelAmenity } from '../../../database/models/hotel-amenity.model';
import { HotelImage } from '../../../database/models/hotel-image.model';
import { RoomType } from '../../../database/models/room-type.model';
import { Op } from 'sequelize';

describe('HotelRepository', () => {
  let repository: HotelRepository;
  let mockHotelModel: any;
  let mockElasticsearchService: any;

  const mockHotel = {
    id: 1,
    name: 'Test Hotel',
    description: 'Test Description',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  beforeEach(() => {
    mockHotelModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findAndCountAll: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockElasticsearchService = {
      indexHotel: jest.fn(),
      searchHotels: jest.fn(),
      deleteHotel: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    // Create repository instance manually to avoid DI issues
    repository = new HotelRepository(mockHotelModel, mockElasticsearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Repository Initialization', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a hotel', async () => {
      mockHotelModel.create.mockResolvedValue(mockHotel);

      const result = await repository.create(mockHotel);

      expect(result).toEqual(mockHotel);
      expect(mockHotelModel.create).toHaveBeenCalledWith(mockHotel);
    });
  });

  describe('findById', () => {
    it('should find hotel by ID with relations', async () => {
      const hotelWithRelations = {
        ...mockHotel,
        amenities: [],
        images: [],
        roomTypes: [],
      };
      mockHotelModel.findByPk.mockResolvedValue(hotelWithRelations);

      const result = await repository.findById(1);

      expect(result).toEqual(hotelWithRelations);
      expect(mockHotelModel.findByPk).toHaveBeenCalledWith(1, {
        include: expect.arrayContaining([
          expect.objectContaining({ association: 'images' }),
          expect.objectContaining({ association: 'roomTypes' }),
          expect.objectContaining({ model: HotelAmenity, as: 'amenities' }),
        ]),
      });
    });

    it('should return null if hotel not found', async () => {
      mockHotelModel.findByPk.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdIncludingDeleted', () => {
    it('should find hotel by ID including soft-deleted records', async () => {
      const deletedHotel = { ...mockHotel, deletedAt: new Date() };
      mockHotelModel.findByPk.mockResolvedValue(deletedHotel);

      const result = await repository.findByIdIncludingDeleted(1);

      expect(result).toEqual(deletedHotel);
      expect(mockHotelModel.findByPk).toHaveBeenCalledWith(1, {
        paranoid: false,
        include: expect.arrayContaining([
          expect.objectContaining({ association: 'images' }),
          expect.objectContaining({ association: 'roomTypes' }),
          expect.objectContaining({ model: HotelAmenity, as: 'amenities' }),
        ]),
      });
    });
  });

  describe('findAll', () => {
    it('should return all hotels with pagination', async () => {
      const hotels = [mockHotel];
      mockHotelModel.findAll.mockResolvedValue(hotels);

      const result = await repository.findAll(10, 0);

      expect(result).toEqual(hotels);
      expect(mockHotelModel.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        order: [['name', 'ASC']]
      });
    });
  });

  describe('update', () => {
    it('should update a hotel', async () => {
      const updateData = { name: 'Updated Hotel' };
      mockHotelModel.update.mockResolvedValue([1]);

      const result = await repository.update(1, updateData);

      expect(result).toBeUndefined();
      expect(mockHotelModel.update).toHaveBeenCalledWith(updateData, {
        where: { id: 1 },
      });
    });
  });

  describe('delete', () => {
    it('should soft delete a hotel', async () => {
      mockHotelModel.destroy.mockResolvedValue(1);

      const result = await repository.delete(1);

      expect(result).toBeUndefined();
      expect(mockHotelModel.destroy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('count', () => {
    it('should return total count of hotels', async () => {
      mockHotelModel.count.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
      expect(mockHotelModel.count).toHaveBeenCalled();
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle hotel active status', async () => {
      mockHotelModel.update.mockResolvedValue([1]);

      const result = await repository.toggleActiveStatus(1, false);

      expect(result).toBeUndefined();
      expect(mockHotelModel.update).toHaveBeenCalledWith(
        { isActive: false },
        { where: { id: 1 } }
      );
    });
  });
});
