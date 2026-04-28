import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Room } from '../../database/models/room.model';
import { RoomService } from './room.service';
import { CreateRoomInput, UpdateRoomInput, SearchRoomsInput } from './dto/room.input';
import { DeleteRoomResponse } from './dto/delete-room.response';
import { GqlAuthGuard } from 'src/common/guards/auth.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { UserTokenPayload } from 'src/common/constants/app.constant';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @Query(() => [Room])
  async rooms(
    @Args('roomTypeId', { type: () => Int, nullable: true })
    roomTypeId?: number,
    @Args('hotelId', { type: () => Int, nullable: true })
    hotelId?: number
  ): Promise<Room[]> {
    if (roomTypeId) {
      return await this.roomService.findByRoomTypeId(roomTypeId);
    }
    if (hotelId) {
      return await this.roomService.findByHotelId(hotelId);
    }
    throw new Error('Either roomTypeId or hotelId must be provided');
  }

  @Query(() => Room, { nullable: true })
  async room(@Args('id', { type: () => Int }) id: number): Promise<Room> {
    return await this.roomService.findById(id);
  }

  @Query(() => [Room])
  async searchRooms(@Args('searchInput') searchInput: SearchRoomsInput): Promise<Room[]> {
    return await this.roomService.search(searchInput);
  }

  @Mutation(() => Room)
  @UseGuards(GqlAuthGuard)
  async createRoom(
    @Args('createRoomInput') createRoomInput: CreateRoomInput,
    @Args('roomTypeId', { type: () => Int }) roomTypeId: number,
    @AuthUser() user: UserTokenPayload
  ): Promise<Room> {
    // Note: hotelId should be derived from roomTypeId in the service
    return await this.roomService.create(createRoomInput, roomTypeId, user.sub);
  }

  @Mutation(() => Room)
  @UseGuards(GqlAuthGuard)
  async updateRoom(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateRoomInput') updateRoomInput: UpdateRoomInput,
    @Args('hotelId', { type: () => Int }) hotelId: number,
    @AuthUser() user: UserTokenPayload
  ): Promise<Room> {
    return await this.roomService.update(id, updateRoomInput, hotelId);
  }

  @Mutation(() => DeleteRoomResponse)
  @UseGuards(GqlAuthGuard)
  async deleteRoom(
    @Args('id', { type: () => Int }) id: number,
    @Args('hotelId', { type: () => Int }) hotelId: number,
    @AuthUser() user: UserTokenPayload
  ): Promise<DeleteRoomResponse> {
    return await this.roomService.delete(id, hotelId);
  }

  @Mutation(() => Room)
  @UseGuards(GqlAuthGuard)
  async updateRoomStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('status', { type: () => String }) status: string,
    @Args('hotelId', { type: () => Int }) hotelId: number,
    @AuthUser() user: UserTokenPayload
  ): Promise<Room> {
    return await this.roomService.updateStatus(id, status, hotelId);
  }

  @Query(() => Int)
  async roomCount(): Promise<number> {
    return await this.roomService.count();
  }
}
