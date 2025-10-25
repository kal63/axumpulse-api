'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TrainerApplications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      fullName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      specialties: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      yearsOfExperience: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      languages: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      certifications: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      portfolio: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      socialMedia: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      availability: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TrainerApplications');
  }
};
