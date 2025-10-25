'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Trainers');

    if (!tableDescription.verifiedAt) {
      await queryInterface.addColumn('Trainers', 'verifiedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.verifiedBy) {
      await queryInterface.addColumn('Trainers', 'verifiedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('Trainers', 'verifiedAt');
    await queryInterface.removeColumn('Trainers', 'verifiedBy');
  }
};
