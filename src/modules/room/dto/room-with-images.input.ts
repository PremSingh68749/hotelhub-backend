import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDecimal, IsEnum, Min, Max, IsArray } from 'class-validator';
import { MultipleImageUploadInput } from '../../../common/dto/image-upload.dto';

@InputType()
export class CreateRoomWithImagesInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  floor?: string;

  @Field(() => Int)
  @IsNumber()
  hotelId: number;

  @Field(() => Int)
  @IsNumber()
  roomTypeId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  customPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => MultipleImageUploadInput, { nullable: true })
  @IsOptional()
  images?: MultipleImageUploadInput;
}

@InputType()
export class UpdateRoomWithImagesInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  floor?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  customPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => MultipleImageUploadInput, { nullable: true })
  @IsOptional()
  newImages?: MultipleImageUploadInput;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsOptional()
  deleteImageIds?: number[];
}
