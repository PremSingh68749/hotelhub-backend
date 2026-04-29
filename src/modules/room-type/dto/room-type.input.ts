import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDecimal, IsEnum, Min, Max, IsBoolean, IsArray } from 'class-validator';

@InputType()
export class CreateRoomTypeInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  maxOccupancy: number;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  maxAdults: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  maxChildren?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  numberOfBeds?: number;

  @Field()
  @IsString()
  @IsOptional()
  bedType?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  roomSize?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  amenities?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@InputType()
export class UpdateRoomTypeInput {
  @Field()
  @IsString()
  @IsOptional()
  name?: string;

  @Field()
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  maxOccupancy?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxAdults?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  maxChildren?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  numberOfBeds?: number;

  @Field()
  @IsString()
  @IsOptional()
  bedType?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(10)
  roomSize?: number;

  @Field()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  amenities?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@InputType()
export class SearchRoomTypesInput {
  @Field()
  @IsNumber()
  @IsOptional()
  hotelId?: number;

  @Field()
  @IsString()
  @IsOptional()
  name?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  minOccupancy?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxOccupancy?: number;

  @Field(() => [String], { nullable: true })
  @IsString()
  @IsOptional()
  amenities?: string[];

  @Field()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}
