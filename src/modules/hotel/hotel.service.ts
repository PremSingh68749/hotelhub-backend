import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { Hotel } from '../../database/models/hotel.model';
import { HotelImage } from '../../database/models/hotel-image.model';
import { HotelAmenity } from '../../database/models/hotel-amenity.model';
import { HotelRepository } from './hotel.repository';
import { SearchHotelsInput } from './dto/hotel.input';
import { CreateHotelWithUrlsInput, UpdateHotelWithUrlsInput } from './dto/hotel-with-urls.input';
import { DeleteHotelResponse } from './dto/delete-hotel.response';

/**
 * Hotel Service - Handles all hotel business logic and GraphQL error handling
 * 
 * This service manages hotel operations including validation, database operations,
 * and comprehensive GraphQL error handling for all hotel-related functionality.
 */
@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(private readonly hotelRepository: HotelRepository) {}

  /**
   * Get a specific hotel by its ID
   * 
   * @param id - The unique identifier of the hotel
   * @returns The hotel details
   * 
   * @throws GraphQLError - If ID is invalid or hotel is not found
   */
  async findById(id: number): Promise<Hotel> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new GraphQLError('Invalid hotel ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'id'
          }
        });
      }
      
      const hotel = await this.hotelRepository.findById(id);
      if (!hotel) {
        throw new GraphQLError('Hotel not found', {
          extensions: {
            code: 'NOT_FOUND',
            field: 'id'
          }
        });
      }
      
      return hotel;
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to retrieve hotel', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get all hotels with pagination support
   * 
   * @param limit - Maximum number of hotels to return (default: 10)
   * @param offset - Number of hotels to skip (default: 0)
   * @returns Array of hotels with pagination
   * 
   * @throws GraphQLError - If pagination parameters are invalid
   */
  async findAll(limit: number = 10, offset: number = 0): Promise<Hotel[]> {
    try {
      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        throw new GraphQLError('Limit must be between 1 and 100', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'limit'
          }
        });
      }
      
      if (offset < 0) {
        throw new GraphQLError('Offset must be non-negative', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'offset'
          }
        });
      }
      
      return this.hotelRepository.findAll(limit, offset);
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to retrieve hotels from database', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Search hotels by name (case-insensitive partial match)
   * 
   * @param name - The search term for hotel name
   * @returns Array of hotels matching the search criteria
   * 
   * @throws GraphQLError - If search term is empty or invalid
   */
  async searchByName(name: string): Promise<Hotel[]> {
    try {
      // Validate search term
      if (!name || name.trim().length === 0) {
        throw new GraphQLError('Search name cannot be empty', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'name'
          }
        });
      }
      
      if (name.length < 2) {
        throw new GraphQLError('Search name must be at least 2 characters long', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'name'
          }
        });
      }
      
      if (name.length > 100) {
        throw new GraphQLError('Search name is too long (max 100 characters)', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'name'
          }
        });
      }
      
      return this.hotelRepository.searchByName(name.trim());
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to search hotels', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get hotels by owner ID
   * 
   * @param ownerId - Owner ID
   * @param limit - Maximum number of hotels to return
   * @param offset - Number of hotels to skip
   * @returns Array of hotels
   */
  async findByOwnerId(ownerId: number, limit: number = 10, offset: number = 0): Promise<Hotel[]> {
    try {
      // Validate owner ID
      if (!ownerId || ownerId <= 0) {
        throw new GraphQLError('Invalid owner ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'ownerId'
          }
        });
      }
      
      return await this.hotelRepository.findByOwnerId(ownerId, limit, offset);
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to retrieve hotels by owner', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Search hotels with Elasticsearch integration
   * 
   * @param searchInput - Search criteria
   * @returns Array of matching hotels
   */
  async search(searchInput: SearchHotelsInput): Promise<Hotel[]> {
    try {
      // Validate search input - make it optional
      if (!searchInput) {
        // If no search input provided, return all active hotels with pagination
        return await this.hotelRepository.search({});
      }

      // Use Elasticsearch for text searches, fall back to SQL for simple queries
      const shouldUseElasticsearch = this.shouldUseElasticsearch(searchInput);
      
      if (shouldUseElasticsearch) {
        return await this.hotelRepository.searchWithElasticsearch(searchInput);
      } else {
        return await this.hotelRepository.search(searchInput);
      }
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to search hotels', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Determine if Elasticsearch should be used for search
   * 
   * @param searchInput - Search criteria
   * @returns boolean indicating whether to use Elasticsearch
   */
  private shouldUseElasticsearch(searchInput: SearchHotelsInput): boolean {
    // Use Elasticsearch for text searches or complex queries
    return !!(
      searchInput.searchQuery ||           // Text search
      searchInput.amenities?.length ||    // Multiple amenities
      (searchInput.minRating !== undefined && searchInput.maxRating !== undefined) || // Rating range
      (searchInput.minPrice !== undefined && searchInput.maxPrice !== undefined)     // Price range
    );
  }

  /**
   * Delete hotel (soft delete)
   *
   * @param id - Hotel ID
   * @param ownerId - Owner ID for authorization
   * @returns DeleteHotelResponse with success, message, and deleted hotel
   */
  async delete(id: number, ownerId: number): Promise<DeleteHotelResponse> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new GraphQLError('Invalid hotel ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'id'
          }
        });
      }

      // Validate owner ID
      if (!ownerId || ownerId <= 0) {
        throw new GraphQLError('Invalid owner ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'ownerId'
          }
        });
      }

      // Check if hotel exists and belongs to owner
      const existingHotel = await this.hotelRepository.findById(id);
      if (!existingHotel) {
        throw new GraphQLError('Hotel not found', {
          extensions: {
            code: 'NOT_FOUND'
          }
        });
      }

      if (existingHotel.ownerId != ownerId) {
        throw new GraphQLError('You can only delete your own hotels', {
          extensions: {
            code: 'FORBIDDEN'
          }
        });
      }

      // Soft delete the hotel (sets deletedAt timestamp)
      await this.hotelRepository.delete(id);

      // Get the deleted hotel (will have deletedAt populated)
      const deletedHotel = await this.hotelRepository.findByIdIncludingDeleted(id);

      return {
        success: true,
        message: 'Hotel deleted successfully',
        hotel: deletedHotel as Hotel,
      };
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }

      // Handle unknown errors
      throw new GraphQLError('Failed to delete hotel', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Toggle hotel active status
   * 
   * @param id - Hotel ID
   * @param isActive - Active status
   * @param ownerId - Owner ID for authorization
   * @returns Updated hotel
   */
  async toggleActiveStatus(id: number, isActive: boolean, ownerId: number): Promise<Hotel> {
    try {
      // Validate ID
      if (!id || id <= 0) {
        throw new GraphQLError('Invalid hotel ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'id'
          }
        });
      }
      
      // Validate owner ID
      if (!ownerId || ownerId <= 0) {
        throw new GraphQLError('Invalid owner ID provided', {
          extensions: {
            code: 'BAD_REQUEST',
            field: 'ownerId'
          }
        });
      }
      
      // Check if hotel exists and belongs to owner
      const existingHotel = await this.hotelRepository.findById(id);
      if (!existingHotel) {
        throw new GraphQLError('Hotel not found', {
          extensions: {
            code: 'NOT_FOUND'
          }
        });
      }

      if (existingHotel.ownerId !== ownerId) {
        throw new GraphQLError('You can only modify your own hotels', {
          extensions: {
            code: 'FORBIDDEN'
          }
        });
      }
      
      await this.hotelRepository.toggleActiveStatus(id, isActive);
      return await this.hotelRepository.findById(id);
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Handle unknown errors
      throw new GraphQLError('Failed to toggle hotel status', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Get the total count of hotels
   * 
   * @returns The total number of hotels in the system
   * 
   * @throws GraphQLError - If database operation fails
   */
  async count(): Promise<number> {
    try {
      return await this.hotelRepository.count();
    } catch (error) {
      throw new GraphQLError('Failed to count hotels', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
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
    try {
      return await this.hotelRepository.findNearby(latitude, longitude, radiusKm);
    } catch (error) {
      throw new GraphQLError('Failed to search nearby hotels', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Create a new hotel with image URLs
   * 
   * @param input - Hotel data with image URLs
   * @param userId - User ID for authorization
   * @returns Created hotel
   * 
   * @throws GraphQLError - If creation fails
   */
  async createWithUrls(input: CreateHotelWithUrlsInput, userId: number): Promise<Hotel> {
    try {
      // Extract images and amenities from input
      const { images, amenities, ...hotelData } = input;

      this.logger.debug(`Creating hotel with data: ${JSON.stringify({ ...hotelData, ownerId: userId })}`);
      this.logger.debug(`Images: ${JSON.stringify(images)}, Amenities: ${JSON.stringify(amenities)}`);

      // Create the hotel first
      const hotel = await this.hotelRepository.create({ ...hotelData, ownerId: userId });
      this.logger.debug(`Hotel created with id: ${hotel.id}`);

      // If images are provided, create hotel image records
      if (images && images.images && images.images.length > 0) {
        this.logger.debug(`Creating ${images.images.length} images for hotel ${hotel.id}`);
        await this.createHotelImages(hotel.id, images.images);
      }

      // If amenities are provided, create hotel amenity records
      if (amenities && amenities.length > 0) {
        this.logger.debug(`Creating ${amenities.length} amenities for hotel ${hotel.id}`);
        await this.createHotelAmenities(hotel.id, amenities);
      }

      // Return the complete hotel with images and amenities
      return await this.hotelRepository.findById(hotel.id);
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Failed to create hotel with images:', error);

      // Handle unknown errors
      throw new GraphQLError(`Failed to create hotel: ${error.message}`, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          originalError: error.message,
        },
      });
    }
  }

  /**
   * Update a hotel with image URLs
   * 
   * @param id - Hotel ID
   * @param input - Hotel update data with image URLs
   * @param userId - User ID for authorization
   * @returns Updated hotel
   * 
   * @throws GraphQLError - If update fails
   */
  async updateWithUrls(id: number, input: UpdateHotelWithUrlsInput, userId: number): Promise<Hotel> {
    try {
      // Check if hotel exists and user owns it
      const existingHotel = await this.hotelRepository.findById(id);
      if (!existingHotel) {
        throw new GraphQLError('Hotel not found', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }

      if (existingHotel.ownerId !== userId) {
        throw new GraphQLError('You can only modify your own hotels', {
          extensions: {
            code: 'FORBIDDEN',
          },
        });
      }

      // Extract image data and amenities from input
      const { newImages, deleteImageIds, amenities, ...hotelData } = input;

      // Update hotel basic information
      await this.hotelRepository.update(id, hotelData);

      // Handle image updates
      await this.updateHotelImages(id, { newImages, deleteImageIds });

      // Handle amenities upsert (if provided)
      if (amenities !== undefined) {
        await this.upsertHotelAmenities(id, amenities);
      }

      // Return the updated hotel with images and amenities
      return await this.hotelRepository.findById(id);
    } catch (error) {
      // Re-throw GraphQL errors
      if (error instanceof GraphQLError) {
        throw error;
      }

      // Handle unknown errors
      throw new GraphQLError('Failed to update hotel with images', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    }
  }

  /**
   * Create hotel image records from URLs
   * 
   * @param hotelId - Hotel ID
   * @param images - Array of image data with URLs
   */
  private async createHotelImages(hotelId: number, images: any[]): Promise<void> {
    const imagePromises = images.map(async (imageData, index) => {
      return await HotelImage.create({
        hotelId,
        url: imageData.url,
        altText: imageData.altText,
        caption: imageData.caption,
        isPrimary: imageData.isPrimary || index === 0, // First image as primary if not specified
        sortOrder: imageData.sortOrder || index + 1,
      });
    });

    await Promise.all(imagePromises);

    // Ensure only one primary image
    await this.ensureSinglePrimaryImage(hotelId);
  }

  /**
   * Update hotel images - add new ones and delete specified ones
   * 
   * @param hotelId - Hotel ID
   * @param imageData - Object containing new images and delete IDs
   */
  private async updateHotelImages(hotelId: number, imageData: { newImages?: any; deleteImageIds?: number[] }): Promise<void> {
    // Delete specified images
    if (imageData.deleteImageIds && imageData.deleteImageIds.length > 0) {
      await this.deleteHotelImages(imageData.deleteImageIds);
    }

    // Add new images
    if (imageData.newImages && imageData.newImages.images && imageData.newImages.images.length > 0) {
      await this.createHotelImages(hotelId, imageData.newImages.images);
    }
  }

  /**
   * Delete hotel images by IDs
   * 
   * @param imageIds - Array of image IDs to delete
   */
  private async deleteHotelImages(imageIds: number[]): Promise<void> {
    await HotelImage.destroy({
      where: {
        id: imageIds,
      },
    });
  }

  /**
   * Ensure only one primary image exists for the hotel
   *
   * @param hotelId - Hotel ID
   */
  private async ensureSinglePrimaryImage(hotelId: number): Promise<void> {
    const primaryImages = await HotelImage.findAll({
      where: {
        hotelId,
        isPrimary: true,
      },
    });

    if (primaryImages.length > 1) {
      // Keep the first one as primary, set others to false
      const [keepPrimary, ...others] = primaryImages;

      await Promise.all(
        others.map(image =>
          HotelImage.update(
            { isPrimary: false },
            { where: { id: image.id } }
          )
        )
      );
    }
  }

  /**
   * Create hotel amenity records from amenity names
   *
   * @param hotelId - Hotel ID
   * @param amenities - Array of amenity names
   */
  private async createHotelAmenities(hotelId: number, amenities: string[]): Promise<void> {
    // Filter out empty/null amenity names
    const validAmenities = amenities
      .filter((name): name is string => !!name && typeof name === 'string')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (validAmenities.length === 0) {
      this.logger.warn(`No valid amenity names provided for hotel ${hotelId}`);
      return;
    }

    try {
      const amenityPromises = validAmenities.map(async (name) => {
        return await HotelAmenity.create({
          hotelId,
          name,
          isAvailable: true,
        });
      });

      await Promise.all(amenityPromises);
      this.logger.log(`Created ${validAmenities.length} amenities for hotel ${hotelId}`);
    } catch (error) {
      this.logger.error(`Failed to create amenities for hotel ${hotelId}:`, error);
      throw error;
    }
  }

  /**
   * Upsert hotel amenities - delete existing and insert new ones
   *
   * @param hotelId - Hotel ID
   * @param amenities - Array of amenity names
   */
  private async upsertHotelAmenities(hotelId: number, amenities: string[]): Promise<void> {
    // Delete existing amenities for this hotel
    await HotelAmenity.destroy({
      where: { hotelId },
    });

    // Insert new amenities if array is not empty
    if (amenities.length > 0) {
      await this.createHotelAmenities(hotelId, amenities);
    }
  }
}
