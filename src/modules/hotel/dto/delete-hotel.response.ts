import { ObjectType, Field } from '@nestjs/graphql';
import { Hotel } from '../../../database/models/hotel.model';

@ObjectType()
export class DeleteHotelResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Hotel, { nullable: true })
  hotel?: Hotel;
}
