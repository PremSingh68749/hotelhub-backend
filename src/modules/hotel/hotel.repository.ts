import { Injectable, forwardRef, Inject, Optional, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Hotel } from '../../database/models/hotel.model';
import { RoomType } from '../../database/models/room-type.model';
import { Room } from '../../database/models/room.model';
import { HotelImage } from '../../database/models/hotel-image.model';
import { HotelAmenity } from '../../database/models/hotel-amenity.model';
import { Op } from 'sequelize';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { SearchHotelsInput } from './dto/hotel.input';

@Injectable()
export class HotelRepository {
  private readonly logger = new Logger(HotelRepository.name);

  constructor(
    @InjectModel(Hotel)
    private hotelModel: typeof Hotel,
    @Optional()
    @Inject(forwardRef(() => ElasticsearchService))
    private readonly elasticsearchService?: ElasticsearchService,
  ) {}

  /**
   * Create a new hotel
   * 
   * @param hotelData - Hotel data
   * @returns Created hotel
   */
  async create(hotelData: Partial<Hotel>): Promise<Hotel> {
    return await this.hotelModel.create(hotelData);
  }

  /**
   * Find hotel by ID
   * 
   * @param id - Hotel ID
   * @returns Hotel or null
   */
  async findById(id: number): Promise<Hotel | null> {
    const hotel = await this.hotelModel.findByPk(id, {
      include: [
        {
          association: 'images',
          order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
        },
        {
          association: 'roomTypes',
          include: ['rooms']
        },
        {
          model: HotelAmenity,
          as: 'amenities',
          required: false
        }
      ]
    });

    // Ensure amenities is never null (GraphQL expects non-nullable array)
    if (hotel && !hotel.amenities) {
      hotel.amenities = [];
    }

    return hotel;
  }

  /**
   * Find hotel by ID including soft-deleted records
   *
   * @param id - Hotel ID
   * @returns Hotel or null (including soft-deleted)
   */
  async findByIdIncludingDeleted(id: number): Promise<Hotel | null> {
    const hotel = await this.hotelModel.findByPk(id, {
      paranoid: false,  // Include soft-deleted records
      include: [
        {
          association: 'images',
          order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
        },
        {
          association: 'roomTypes',
          include: ['rooms']
        },
        {
          model: HotelAmenity,
          as: 'amenities',
          required: false
        }
      ]
    });

    if (hotel && !hotel.amenities) {
      hotel.amenities = [];
    }

    return hotel;
  }

  /**
   * Find hotels by owner ID
   * 
   * @param ownerId - Owner ID
   * @returns Array of hotels
   */
  /**
   * Search hotels by owner ID with pagination
   * 
   * @param ownerId - Owner ID
   * @param limit - Maximum number of hotels to return
   * @param offset - Number of hotels to skip
   * @returns Array of hotels
   */
  async findByOwnerId(ownerId: number, limit: number = 10, offset: number = 0): Promise<Hotel[]> {
    const hotels = await this.hotelModel.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: HotelImage,
          as: 'images',
          order: [['sortOrder', 'ASC']]
        },
        {
          model: RoomType,
          as: 'roomTypes',
          include: [
            {
              model: Room,
              as: 'rooms',
              attributes: ['id'] // Only count the rooms, don't need all room data
            }
          ]
        },
        {
          model: HotelAmenity,
          as: 'amenities',
          required: false
        }
      ]
    });

    // Ensure amenities is never null for each hotel
    hotels.forEach(hotel => {
      if (!hotel.amenities) {
        hotel.amenities = [];
      }
    });

    return hotels;
  }

  /**
   * Get all hotels with pagination
   * 
   * @param limit - Maximum number of hotels to return
   * @param offset - Number of hotels to skip
   * @returns Array of hotels with pagination
   */
  async findAll(limit: number = 10, offset: number = 0): Promise<Hotel[]> {
    return await this.hotelModel.findAll({
      limit,
      offset,
      order: [['name', 'ASC']]
    });
  }

  async findAllForElasticsearch(): Promise<Hotel[]> {
    return await this.hotelModel.findAll({
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search hotels with comprehensive filters
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching hotels
   */
  async search(searchInput: any = {}): Promise<Hotel[]> {
    const whereConditions: any = {
      isActive: true
    };

    // Full-text search across name, description, address, city
    if (searchInput.searchQuery) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${searchInput.searchQuery}%` } },
        { description: { [Op.iLike]: `%${searchInput.searchQuery}%` } },
        { city: { [Op.iLike]: `%${searchInput.searchQuery}%` } },
        { state: { [Op.iLike]: `%${searchInput.searchQuery}%` } },
        { country: { [Op.iLike]: `%${searchInput.searchQuery}%` } }
      ];
    }

    // Location filters
    if (searchInput.city) {
      whereConditions.city = { [Op.iLike]: `%${searchInput.city}%` };
    }

    if (searchInput.state) {
      whereConditions.state = { [Op.iLike]: `%${searchInput.state}%` };
    }

    if (searchInput.country) {
      whereConditions.country = { [Op.iLike]: `%${searchInput.country}%` };
    }

    // Rating filters
    if (searchInput.minRating !== undefined) {
      whereConditions.rating = { [Op.gte]: searchInput.minRating };
    }

    if (searchInput.maxRating !== undefined) {
      whereConditions.rating = { 
        ...whereConditions.rating,
        [Op.lte]: searchInput.maxRating 
      };
    }

    // Price filters
    if (searchInput.minPrice !== undefined || searchInput.maxPrice !== undefined) {
      // TODO: Re-enable when room types database schema matches model
    }

    // Meal plan filter
    if (searchInput.mealPlan) {
      whereConditions.mealPlan = searchInput.mealPlan;
    }

    // Property type filter
    if (searchInput.propertyType) {
      whereConditions.propertyType = searchInput.propertyType;
    }

    // Amenities filter
    if (searchInput.amenities && searchInput.amenities.length > 0) {
      // TODO: Implement proper amenities filtering with HotelAmenity model
    }

    // Guest count filter
    if (searchInput.adults !== undefined) {
      // TODO: Implement proper guest count filtering with roomTypes.maxOccupancy
    }

    // Date availability filter (simplified - for now skip date filtering until room availability is implemented)
    if (searchInput.checkInDate && searchInput.checkOutDate) {
      // TODO: Implement date availability checking with room availability
    }

    const queryOptions: any = {
      where: whereConditions,
      order: [['rating', 'DESC'], ['totalReviews', 'DESC']],
      distinct: true, // Add distinct to avoid duplicate hotels when joining with room types
    };

    // Add pagination if provided
    if (searchInput.limit !== undefined) {
      queryOptions.limit = searchInput.limit;
    }
    if (searchInput.offset !== undefined) {
      queryOptions.offset = searchInput.offset;
    }

    // Include relationships if needed for filtering
    const include: any[] = [];
    
    // Temporarily disable room types include due to database schema mismatch
    // The RoomType model has fields that don't exist in the database table
    // TODO: Either update database schema or remove fields from RoomType model
    
    // Always include room types for price filtering and to show available room options
    // include.push({
    //   model: RoomType,
    //   where: {
    //     isActive: true
    //   },
    //   required: false // Use LEFT JOIN so hotels without room types are still returned
    // });

    // Include amenities if amenities filtering is applied
    if (searchInput.amenities && searchInput.amenities.length > 0) {
      include.push({
        model: HotelAmenity,
        where: {
          amenity: { [Op.in]: searchInput.amenities }
        },
        required: false // Use LEFT JOIN so hotels without amenities are still returned
      });
    }

    if (include.length > 0) {
      queryOptions.include = include;
    }

    return await this.hotelModel.findAll(queryOptions);
  }

  /**
   * Find all hotels for Elasticsearch indexing
   * 
   * @returns Array of all hotels
   */
  async findAllHotelsForElasticsearch(): Promise<Hotel[]> {
    return await this.hotelModel.findAll({
      include: [
        {
          model: RoomType,
          where: { isActive: true },
          required: false,
        },
        {
          model: HotelAmenity,
          required: false,
        },
      ],
    });
  }

  /**
   * Search hotels using Elasticsearch
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching hotels
   */
  async searchWithElasticsearch(searchInput: SearchHotelsInput): Promise<Hotel[]> {
    try {
      // Check if Elasticsearch is available
      if (!this.elasticsearchService) {
        return this.search(searchInput);
      }

      const isHealthy = await this.elasticsearchService.isHealthy();
      if (!isHealthy) {
        return this.search(searchInput);
      }

      // Use Elasticsearch for search
      const esResult = await this.elasticsearchService.searchHotels(searchInput);
      
      // Convert ES results to Hotel models
      const hotelIds = esResult.hits.hits.map(hit => hit._source.id);
      
      if (hotelIds.length === 0) {
        return [];
      }

      // Fetch full hotel data from database with relationships
      const hotels = await this.hotelModel.findAll({
        where: {
          id: hotelIds,
          isActive: true,
        },
        include: [
          {
            model: RoomType,
            where: { isActive: true },
            required: false,
          },
          {
            model: HotelAmenity,
            required: false,
          },
        ],
        order: [
          ['rating', 'DESC'],
          ['totalReviews', 'DESC'],
        ],
      });

      // // Sort hotels according to Elasticsearch score order
      // const hotelMap = new Map(hotels.map(hotel => [hotel.id, hotel]));
      // const sortedHotels = hotelIds
      //   .map(id => hotelMap.get(id))
      //   .filter(hotel => hotel !== undefined);

      return hotels;
    } catch (error) {
      console.error('Elasticsearch search failed, falling back to SQL search:', error);
      return this.search(searchInput);
    }
  }

  /**
   * Index hotel in Elasticsearch
   * 
   * @param hotel - Hotel data to index
   */
  async indexHotelInElasticsearch(hotel: Hotel): Promise<void> {
    try {
      if (!this.elasticsearchService) {
        return;
      }

      const isHealthy = await this.elasticsearchService.isHealthy();
      if (!isHealthy) {
        return;
      }

      await this.elasticsearchService.indexHotel(hotel);
    } catch (error) {
      this.logger.error('Failed to index hotel in Elasticsearch:', error);
    }
  }

  /**
   * Delete hotel from Elasticsearch
   * 
   * @param hotelId - Hotel ID to delete from index
   */
  async deleteHotelFromElasticsearch(hotelId: number): Promise<void> {
    try {
      if (!this.elasticsearchService) {
        return;
      }

      await this.elasticsearchService.deleteHotel(hotelId);
    } catch (error) {
      this.logger.error('Failed to delete hotel from Elasticsearch:', error);
    }
  }

  /**
   * Update hotel
   * 
   * @param id - Hotel ID
   * @param updateData - Update data
   * @returns Updated hotel
   */
  async update(id: number, updateData: Partial<Hotel>): Promise<Hotel> {
    await this.hotelModel.update(updateData, {
      where: { id }
    });
    
    // Update hotel in Elasticsearch
    const updatedHotel = this.findById(id);
    if (updatedHotel) {
      await this.indexHotelInElasticsearch(await updatedHotel);
    }
    
    return this.findById(id);
  }

  /**
   * Delete hotel
   * 
   * @param id - Hotel ID
   */
  async delete(id: number): Promise<void> {
    await this.hotelModel.destroy({
      where: { id }
    });
  }

  /**
   * Toggle hotel active status
   * 
   * @param id - Hotel ID
   * @param isActive - Active status
   */
  async toggleActiveStatus(id: number, isActive: boolean): Promise<void> {
    await this.update(id, { isActive });
  }

  /**
   * Get hotel count
   * 
   * @returns Number of hotels
   */
  async count(): Promise<number> {
    return await this.hotelModel.count();
  }

  /**
   * Search hotels by name (case-insensitive partial match)
   * 
   * @param name - The search term for hotel name
   * @returns Array of hotels matching search criteria
   */
  async searchByName(name: string): Promise<Hotel[]> {
    return await this.hotelModel.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });
  }

  /**
   * Find hotels near a location (geospatial search)
   * 
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param radiusKm - Search radius in kilometers
   * @returns Array of nearby hotels
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Hotel[]> {
    // Using Haversine formula approximation with bounding box
    const latDelta = radiusKm / 111; // Approximate km to degrees
    const lonDelta = radiusKm / 111;

    return await this.hotelModel.findAll({
      where: {
        isActive: true,
        latitude: {
          [Op.between]: [latitude - latDelta, latitude + latDelta]
        },
        longitude: {
          [Op.between]: [longitude - lonDelta, longitude + lonDelta]
        }
      },
      order: [['rating', 'DESC']]
    });
  }
}
