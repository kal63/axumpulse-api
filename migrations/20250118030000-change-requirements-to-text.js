'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Change the requirements column from JSON to TEXT
        await queryInterface.changeColumn('Challenges', 'requirements', {
            type: Sequelize.TEXT,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert back to JSON type
        await queryInterface.changeColumn('Challenges', 'requirements', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: {}
        });
    }
};



