import { ObjectType, Field } from '@nestjs/graphql';
import { RoomType } from '../../../database/models/room-type.model';

@ObjectType()
export class DeleteRoomTypeResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => RoomType, { nullable: true })
  roomType?: RoomType;
}
