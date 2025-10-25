'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Increase the size of the kind column to accommodate 'trainer_challenge'
        await queryInterface.changeColumn('Challenges', 'kind', {
            type: Sequelize.STRING(32),
            allowNull: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert back to original size
        await queryInterface.changeColumn('Challenges', 'kind', {
            type: Sequelize.STRING(16),
            allowNull: false,
        });
    }
};



