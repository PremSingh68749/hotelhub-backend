'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deletedAt column for soft delete
    await queryInterface.addColumn('hotels', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove deletedAt column
    await queryInterface.removeColumn('hotels', 'deletedAt');
  }
};
