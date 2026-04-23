import { Column, Model, DataType, Table, HasMany, BelongsTo } from 'sequelize-typescript';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Booking } from './booking.model';
import { User } from './user.model';
import { RoomType } from './room-type.model';
import { HotelImage } from './hotel-image.model';
import { HotelAmenity } from './hotel-amenity.model';
import { Review } from './review.model';

@ObjectType()
@Table({
  tableName: 'hotels',
  timestamps: true,
  paranoid: true,
})
export class Hotel extends Model<Hotel> {
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
  name: string;

  @Field()
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  address: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  city: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  state: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  country: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  postalCode: string;

  @Field({ nullable: true })
  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
    defaultValue: 0.0,
  })
  latitude: number;

  @Field({ nullable: true })
  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: false,
    defaultValue: 0.0,
  })
  longitude: number;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string;

  @Field()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  website?: string;

  @Field({ nullable: true })
  @Column({
    type: DataType.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  rating: number;

  @Field({ nullable: true })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalReviews: number;

  @Field()
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  @Field()
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isVerified: boolean;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  mealPlan?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  propertyType?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  checkInTime?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  checkOutTime?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  cancellationPolicy?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  petPolicy?: string;

  @Field(() => String, { nullable: true })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  parkingInfo?: string;

  @Field(() => ID)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  })
  ownerId: number;

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

  @Field(() => Date, { nullable: true })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deletedAt?: Date;

  // Relationships
  @BelongsTo(() => User, { foreignKey: 'ownerId' })
  owner: User;

  @HasMany(() => Booking, { foreignKey: 'hotelId' })
  bookings: Booking[];

  @Field(() => [RoomType])
  @HasMany(() => RoomType, { foreignKey: 'hotelId' })
  roomTypes: RoomType[];

  @Field(() => [HotelImage])
  @HasMany(() => HotelImage, { foreignKey: 'hotelId' })
  images: HotelImage[];

  @Field(() => [HotelAmenity])
  @HasMany(() => HotelAmenity, { foreignKey: 'hotelId' })
  amenities: HotelAmenity[];

  @HasMany(() => Review, { foreignKey: 'hotelId' })
  reviews: Review[];
}
