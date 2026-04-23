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

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

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

  @Field()
  @IsNumber()
  @IsOptional()
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

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @Field(() => MultipleImageUrlInput, { nullable: true })
  @IsOptional()
  newImages?: MultipleImageUrlInput;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsOptional()
  deleteImageIds?: number[];
}
