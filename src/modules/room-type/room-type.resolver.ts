import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { RoomType } from '../../database/models/room-type.model';
import { RoomTypeService } from './room-type.service';
import { CreateRoomTypeInput, UpdateRoomTypeInput, SearchRoomTypesInput } from './dto/room-type.input';
import { DeleteRoomTypeResponse } from './dto/delete-room-type.response';

@Resolver(() => RoomType)
export class RoomTypeResolver {
  constructor(private readonly roomTypeService: RoomTypeService) {}

  @Query(() => [RoomType])
  async roomTypes(
    @Args('hotelId', { type: () => Int, nullable: true })
    hotelId?: number
  ): Promise<RoomType[]> {
    return await this.roomTypeService.findByHotelId(hotelId);
  }

  @Query(() => RoomType, { nullable: true })
  async roomType(@Args('id', { type: () => Int }) id: number): Promise<RoomType> {
    return await this.roomTypeService.findById(id);
  }

  @Query(() => [RoomType])
  async searchRoomTypes(@Args('searchInput') searchInput: SearchRoomTypesInput): Promise<RoomType[]> {
    return await this.roomTypeService.search(searchInput);
  }

  @Mutation(() => RoomType)
  async createRoomType(
    @Args('createRoomTypeInput') createRoomTypeInput: CreateRoomTypeInput,
    @Args('hotelId', { type: () => Int }) hotelId: number
  ): Promise<RoomType> {
    return await this.roomTypeService.create(createRoomTypeInput, hotelId);
  }

  @Mutation(() => RoomType)
  async updateRoomType(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateRoomTypeInput') updateRoomTypeInput: UpdateRoomTypeInput,
    @Args('hotelId', { type: () => Int }) hotelId: number
  ): Promise<RoomType> {
    return await this.roomTypeService.update(id, updateRoomTypeInput, hotelId);
  }

  @Mutation(() => DeleteRoomTypeResponse)
  async deleteRoomType(
    @Args('id', { type: () => Int }) id: number,
    @Args('hotelId', { type: () => Int }) hotelId: number
  ): Promise<DeleteRoomTypeResponse> {
    return await this.roomTypeService.delete(id, hotelId);
  }

  @Mutation(() => RoomType)
  async toggleRoomTypeActiveStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
    @Args('hotelId', { type: () => Int }) hotelId: number
  ): Promise<RoomType> {
    return await this.roomTypeService.toggleActiveStatus(id, isActive, hotelId);
  }
}
