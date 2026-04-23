import { Column, Model, DataType, Table, BelongsTo } from 'sequelize-typescript';
import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Hotel } from './hotel.model';

@ObjectType()
@Table({
  tableName: 'hotel_amenities',
  timestamps: true,
})
export class HotelAmenity extends Model<HotelAmenity> {
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

  @Field({ nullable: true })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Field({ nullable: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  icon?: string; // Icon name or URL

  @Field()
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isAvailable: boolean;

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
}
