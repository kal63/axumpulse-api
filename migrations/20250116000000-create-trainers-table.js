"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotency guard: some databases already have Trainers + indexes
    const existingTables = new Set((await queryInterface.showAllTables()).map((t) => String(t).toLowerCase()));
    if (existingTables.has("trainers")) {
      console.log("Trainers table already exists, skipping create.");
      return;
    }

    await queryInterface.createTable("Trainers", {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      bio: { type: Sequelize.TEXT, allowNull: true },
      specialties: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "TrainerApplications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      verifiedAt: { type: Sequelize.DATE, allowNull: true },
      verifiedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // Add indexes with explicit names to avoid duplicate-key issues
    await queryInterface.addIndex("Trainers", ["applicationId"], { name: "trainers_application_id" });
    await queryInterface.addIndex("Trainers", ["verifiedAt"], { name: "trainers_verified_at" });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex("Trainers", "trainers_application_id");
    } catch (e) { }
    try {
      await queryInterface.removeIndex("Trainers", "trainers_verified_at");
    } catch (e) { }
    await queryInterface.dropTable("Trainers");
  },
};
