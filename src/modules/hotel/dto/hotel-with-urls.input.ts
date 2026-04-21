import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDecimal, IsEnum, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { MultipleImageUrlInput } from '../../../common/dto/image-url.dto';

@InputType()
export class CreateHotelWithUrlsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  address: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  city: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  state: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  country: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @Field()
  @IsString()
  @IsOptional()
  phone?: string;

  @Field()
  @IsString()
  @IsOptional()
  email?: string;

  @Field()
  @IsString()
  @IsOptional()
  website?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalRooms?: number;

  @Field()
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @Field()
  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasWiFi?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasPool?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasGym?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasSpa?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasRestaurant?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasBar?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasRoomService?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasMeetingRooms?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasBusinessCenter?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasPetFriendly?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasAirportShuttle?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasConcierge?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  has24HourFrontDesk?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasAirConditioning?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasHeating?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @Field()
  @IsBoolean()
  @IsOptional()
  hasDisabledAccess?: boolean;

  @Field(() => MultipleImageUrlInput, { nullable: true })
  @IsOptional()
  images?: MultipleImageUrlInput;
}

@InputType()
export class UpdateHotelWithUrlsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  @Min(0)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalRooms?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasParking?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasWiFi?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasPool?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasGym?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasSpa?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasRestaurant?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasBar?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasRoomService?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasMeetingRooms?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasBusinessCenter?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasPetFriendly?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasAirportShuttle?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasConcierge?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  has24HourFrontDesk?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasHeating?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasElevator?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasDisabledAccess?: boolean;

  @Field(() => MultipleImageUrlInput, { nullable: true })
  @IsOptional()
  newImages?: MultipleImageUrlInput;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsOptional()
  deleteImageIds?: number[];
}
