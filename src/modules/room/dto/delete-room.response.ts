import { ObjectType, Field } from '@nestjs/graphql';
import { Room } from '../../../database/models/room.model';

@ObjectType()
export class DeleteRoomResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Room, { nullable: true })
  room?: Room;
}
