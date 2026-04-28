'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update room_types table
    await queryInterface.changeColumn('room_types', 'amenities', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add images column to room_types
    await queryInterface.addColumn('room_types', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add images column to rooms
    await queryInterface.addColumn('rooms', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Remove boolean amenity fields from room_types table
    const roomTypeBooleanFields = [
      'hasAirConditioning',
      'hasHeating', 
      'hasPrivateBathroom',
      'hasKitchen',
      'hasBalcony',
      'hasSeaView',
      'hasMountainView',
      'hasCityView',
      'isSmokingAllowed',
      'isPetFriendly'
    ];

    for (const field of roomTypeBooleanFields) {
      try {
        await queryInterface.removeColumn('room_types', field);
      } catch (error) {
        // Column might not exist, continue
        console.log(`Column ${field} not found in room_types, continuing...`);
      }
    }

    // Remove boolean amenity fields from rooms table
    const roomBooleanFields = [
      'isSmokingAllowed',
      'isPetFriendly',
      'hasMinibar',
      'hasSafe',
      'hasBalcony',
      'hasBathtub',
      'hasShower',
      'hasKitchenette',
      'hasWorkDesk',
      'hasTV',
      'hasWiFi',
      'hasAirConditioning',
      'hasHeating'
    ];

    for (const field of roomBooleanFields) {
      try {
        await queryInterface.removeColumn('rooms', field);
      } catch (error) {
        // Column might not exist, continue
        console.log(`Column ${field} not found in rooms, continuing...`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert room_types.amenities back to JSON
    await queryInterface.changeColumn('room_types', 'amenities', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // Remove images columns
    await queryInterface.removeColumn('room_types', 'images');
    await queryInterface.removeColumn('rooms', 'images');

    // Add back boolean amenity fields to room_types
    const roomTypeBooleanFields = [
      { name: 'hasAirConditioning', defaultValue: false },
      { name: 'hasHeating', defaultValue: false },
      { name: 'hasPrivateBathroom', defaultValue: false },
      { name: 'hasKitchen', defaultValue: false },
      { name: 'hasBalcony', defaultValue: false },
      { name: 'hasSeaView', defaultValue: false },
      { name: 'hasMountainView', defaultValue: false },
      { name: 'hasCityView', defaultValue: false },
      { name: 'isSmokingAllowed', defaultValue: false },
      { name: 'isPetFriendly', defaultValue: false }
    ];

    for (const field of roomTypeBooleanFields) {
      try {
        await queryInterface.addColumn('room_types', field.name, {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: field.defaultValue,
        });
      } catch (error) {
        // Column might already exist, continue
        console.log(`Column ${field.name} already exists in room_types, continuing...`);
      }
    }

    // Add back boolean amenity fields to rooms
    const roomBooleanFields = [
      { name: 'isSmokingAllowed', defaultValue: false },
      { name: 'isPetFriendly', defaultValue: false },
      { name: 'hasMinibar', defaultValue: false },
      { name: 'hasSafe', defaultValue: false },
      { name: 'hasBalcony', defaultValue: false },
      { name: 'hasBathtub', defaultValue: false },
      { name: 'hasShower', defaultValue: false },
      { name: 'hasKitchenette', defaultValue: false },
      { name: 'hasWorkDesk', defaultValue: false },
      { name: 'hasTV', defaultValue: false },
      { name: 'hasWiFi', defaultValue: false },
      { name: 'hasAirConditioning', defaultValue: false },
      { name: 'hasHeating', defaultValue: false }
    ];

    for (const field of roomBooleanFields) {
      try {
        await queryInterface.addColumn('rooms', field.name, {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: field.defaultValue,
        });
      } catch (error) {
        // Column might already exist, continue
        console.log(`Column ${field.name} already exists in rooms, continuing...`);
      }
    }
  },
};
