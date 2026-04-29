import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max, IsArray } from 'class-validator';
import { RoomStatus } from '../../../database/models/room.model';

@InputType()
export class CreateRoomInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @Field()
  @IsString()
  @IsOptional()
  floor?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  customPrice?: number;

  @Field()
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => RoomStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@InputType()
export class UpdateRoomInput {
  @Field()
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @Field()
  @IsString()
  @IsOptional()
  floor?: string;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  customPrice?: number;

  @Field()
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => RoomStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@InputType()
export class SearchRoomsInput {
  @Field()
  @IsNumber()
  @IsOptional()
  roomTypeId?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  hotelId?: number;

  @Field()
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @Field(() => RoomStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @Field()
  @IsString()
  @IsOptional()
  floor?: string;

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
  @Max(100)
  limit?: number;

  @Field()
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}
