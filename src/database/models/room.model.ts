import { Column, Model, DataType, Table, HasMany, BelongsTo } from 'sequelize-typescript';
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { Hotel } from './hotel.model';
import { RoomType } from './room-type.model';
import { Booking } from './booking.model';

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  CLEANING = 'CLEANING'
}

@ObjectType()
@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class Room extends Model<Room> {
  @Field(() => ID)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  roomNumber: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  floor?: string;

  @Field(() => RoomStatus)
  @Column({
    type: DataType.ENUM(...Object.values(RoomStatus)),
    allowNull: false,
    defaultValue: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @Field()
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  customPrice?: number; // Override base price from room type if set

  @Field()
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Field()
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Field(() => ID)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'hotels',
      key: 'id',
    },
  })
  hotelId: number;

  @Field(() => ID)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'room_types',
      key: 'id',
    },
  })
  roomTypeId: number;

  @Field(() => Date)
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Field(() => Date)
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => Hotel, { foreignKey: 'hotelId' })
  hotel: Hotel;

  @BelongsTo(() => RoomType, { foreignKey: 'roomTypeId' })
  roomType: RoomType;

  @HasMany(() => Booking, { foreignKey: 'roomId' })
  bookings: Booking[];

  @Field()
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  images?: string; // JSON string array of image URLs
}

// Register enum with GraphQL
registerEnumType(RoomStatus, {
  name: 'RoomStatus',
  description: 'Room status classification',
});
