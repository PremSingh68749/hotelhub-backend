import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDecimal, IsEnum, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { CreateRoomTypeInput, UpdateRoomTypeInput } from './room-type.input';
import { MultipleImageUploadInput } from '../../../common/dto/image-upload.dto';

@InputType()
export class CreateRoomTypeWithImagesInput extends CreateRoomTypeInput {
  @Field(() => Int)
  @IsNumber()
  hotelId: number;

  @Field(() => MultipleImageUploadInput, { nullable: true })
  @IsOptional()
  imageUpload?: MultipleImageUploadInput;
}

@InputType()
export class UpdateRoomTypeWithImagesInput extends UpdateRoomTypeInput {
  @Field(() => MultipleImageUploadInput, { nullable: true })
  @IsOptional()
  newImages?: MultipleImageUploadInput;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsOptional()
  deleteImageIds?: number[];
}
