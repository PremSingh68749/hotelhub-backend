import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { Hotel } from '../../database/models/hotel.model';
import { HotelService } from './hotel.service';
import { SearchHotelsInput } from './dto/hotel.input';
import { CreateHotelWithUrlsInput, UpdateHotelWithUrlsInput } from './dto/hotel-with-urls.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/auth.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { User } from 'src/database/models/user.model';
import { UserTokenPayload } from 'src/common/constants/app.constant';

/**
 * Hotel Resolver - Handles all hotel-related GraphQL operations
 * 
 * This resolver provides CRUD operations for hotel management.
 * All business logic and exception handling is handled by the HotelService.
 */
@Resolver(() => Hotel)
export class HotelResolver {
  constructor(private readonly hotelService: HotelService) {}

  /**
   * Get a specific hotel by its ID
   * 
   * @param id - The unique identifier of the hotel
   * @returns The hotel details or null if not found
   * 
   * @example
   * ```graphql
   * query {
   *   hotel(id: 1) {
   *     id
   *     name
   *     location
   *     price
   *     createdAt
   *     updatedAt
   *   }
   * }
   * ```
   */
  @Query(() => Hotel, { 
    name: 'hotel',
    description: 'Get a specific hotel by its ID',
    nullable: true
  })
  async getHotelById(@Args('id', { type: () => Int }) id: number): Promise<Hotel | null> {
    return this.hotelService.findById(id);
  }

  /**
   * Get all hotels with pagination support
   * 
   * @param limit - Maximum number of hotels to return (default: 10)
   * @param offset - Number of hotels to skip (default: 0)
   * @returns Array of hotels with pagination
   * 
   * @example
   * ```graphql
   * query {
   *   hotels(limit: 10, offset: 0) {
   *     id
   *     name
   *     location
   *     price
   *     createdAt
   *     updatedAt
   *   }
   * }
   * ```
   */
  @Query(() => [Hotel], { 
    name: 'hotels',
    description: 'Get all hotels with pagination support'
  })
  async getHotels(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<Hotel[]> {
    return this.hotelService.findAll(limit, offset);
  }

  /**
   * Get hotels by owner ID with pagination
   * @param limit - Maximum number of hotels to return
   * @param offset - Number of hotels to skip
   * @returns Array of hotels
   */
  @Query(() => [Hotel], { 
    name: 'hotelsByOwner',
    description: 'Get hotels by owner ID with pagination'
  })
  @UseGuards(GqlAuthGuard)
  async getHotelsByOwner(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
    @AuthUser() user: UserTokenPayload
  ): Promise<Hotel[]> {
    return this.hotelService.findByOwnerId(user.sub, limit, offset);
  }

  /**
   * Comprehensive hotel search with multiple filters
   * 
   * @param searchInput - Search criteria including location, price, rating, amenities
   * @returns Array of matching hotels
   */
  @Query(() => [Hotel], { 
    name: 'searchHotels',
    description: 'Comprehensive hotel search with multiple filters'
  })
  async searchHotels(@Args('input') searchInput: SearchHotelsInput): Promise<Hotel[]> {
    return this.hotelService.search(searchInput);
  }

  /**
   * Delete a hotel
   * 
   * @param id - Hotel ID
   * @param ownerId - Owner ID for authorization
   * @returns Success message
   */
  @Mutation(() => Hotel, { 
    name: 'deleteHotel',
    description: 'Delete a hotel'
  })
  async deleteHotel(
    @Args('id', { type: () => Int }) id: number,
    @Args('ownerId', { type: () => Int }) ownerId: number
  ): Promise<{ success: boolean; message: string }> {
    return this.hotelService.delete(id, ownerId);
  }

  /**
   * Toggle hotel active status
   * 
   * @param id - Hotel ID
   * @param isActive - Active status
   * @param ownerId - Owner ID for authorization
   * @returns Updated hotel
   */
  @Mutation(() => Hotel, { 
    name: 'toggleHotelActiveStatus',
    description: 'Toggle hotel active status'
  })
  async toggleHotelActiveStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
    @Args('ownerId', { type: () => Int }) ownerId: number
  ): Promise<Hotel> {
    return this.hotelService.toggleActiveStatus(id, isActive, ownerId);
  }

  /**
   * Get total count of hotels
   * 
   * @returns Number of hotels
   */
  @Query(() => Int, { 
    name: 'hotelCount',
    description: 'Get total count of hotels'
  })
  async getHotelCount(): Promise<number> {
    return this.hotelService.count();
  }

  /**
   * Find hotels near a location (geospatial search)
   * 
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param radiusKm - Search radius in kilometers
   * @returns Array of nearby hotels
   */
  @Query(() => [Hotel], { 
    name: 'searchNearby',
    description: 'Find hotels near a location (geospatial search)'
  })
  async searchNearby(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
    @Args('radiusKm', { type: () => Int, nullable: true, defaultValue: 10 }) radiusKm?: number
  ): Promise<Hotel[]> {
    return this.hotelService.findNearby(latitude, longitude, radiusKm || 10);
  }

  /**
   * Create a new hotel with image URLs
   * 
   * @param input - Hotel data with image URLs
   * @param user - Authenticated user
   * @returns Created hotel
   */
  @Mutation(() => Hotel, { 
    name: 'createHotelWithUrls',
    description: 'Create a new hotel with image URLs (separate file upload)'
  })
  @UseGuards(GqlAuthGuard)
  async createHotelWithUrls(
    @Args('input') input: CreateHotelWithUrlsInput,
    @AuthUser() user: UserTokenPayload
  ): Promise<Hotel> {
    return this.hotelService.createWithUrls(input, user.sub);
  }

  /**
   * Update a hotel with image URLs
   * 
   * @param id - Hotel ID
   * @param input - Hotel update data with image URLs
   * @param user - Authenticated user
   * @returns Updated hotel
   */
  @Mutation(() => Hotel, { 
    name: 'updateHotelWithUrls',
    description: 'Update a hotel with image URLs (separate file upload)'
  })
  @UseGuards(GqlAuthGuard)
  async updateHotelWithUrls(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateHotelWithUrlsInput,
    @AuthUser() user: UserTokenPayload
  ): Promise<Hotel> {
    return this.hotelService.updateWithUrls(id, input, user.sub);
  }
}
