'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TrainerSites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      headline: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      subheadline: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      philosophy: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      targetAudience: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      heroBackgroundImage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      galleryImages: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      theme: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      sections: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      trainerContent: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      socialLinks: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      ctaText: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'published'
      },
      viewCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('TrainerSites', ['userId'], {
      unique: true,
      name: 'trainer_sites_user_id_unique'
    });

    await queryInterface.addIndex('TrainerSites', ['slug'], {
      unique: true,
      name: 'trainer_sites_slug_unique'
    });

    await queryInterface.addIndex('TrainerSites', ['status'], {
      name: 'trainer_sites_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TrainerSites');
  }
};

