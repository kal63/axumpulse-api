"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotency guard: some databases already have Challenges + indexes
    const existingTables = new Set((await queryInterface.showAllTables()).map((t) => String(t).toLowerCase()));
    if (existingTables.has("challenges")) {
      console.log("Challenges table already exists, skipping create.");
      return;
    }

    await queryInterface.createTable("Challenges", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      kind: { type: Sequelize.STRING(32), allowNull: false },
      ruleJson: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      startTime: { type: Sequelize.DATE, allowNull: false },
      endTime: { type: Sequelize.DATE, allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },

      type: {
        type: Sequelize.ENUM("fitness", "nutrition", "wellness", "achievement"),
        allowNull: true,
        defaultValue: "fitness",
      },
      difficulty: {
        type: Sequelize.ENUM("beginner", "intermediate", "advanced"),
        allowNull: true,
        defaultValue: "beginner",
      },
      duration: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 7 },
      xpReward: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 100 },
      requirements: { type: Sequelize.TEXT, allowNull: true },
      contentIds: { type: Sequelize.JSON, allowNull: true, defaultValue: [] },
      language: { type: Sequelize.STRING(5), allowNull: true, defaultValue: "en" },
      status: {
        type: Sequelize.ENUM("draft", "pending", "approved", "rejected", "active"),
        allowNull: true,
        defaultValue: "draft",
      },
      rejectionReason: { type: Sequelize.TEXT, allowNull: true },
      participantCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      completionCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      isPublic: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: true },
      isTrainerCreated: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },

      trainerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "trainers",
          key: "userId",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // Add indexes similar to model
    await queryInterface.addIndex("Challenges", ["trainerId"], { name: "challenges_trainer_id" });
    await queryInterface.addIndex("Challenges", ["status"], { name: "challenges_status" });
    await queryInterface.addIndex("Challenges", ["type"], { name: "challenges_type" });
    await queryInterface.addIndex("Challenges", ["difficulty"], { name: "challenges_difficulty" });
    await queryInterface.addIndex("Challenges", ["isPublic"], { name: "challenges_is_public" });
    await queryInterface.addIndex("Challenges", ["isTrainerCreated"], { name: "challenges_is_trainer_created" });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes is not strictly necessary before drop, but we keep symmetry
    try {
      await queryInterface.removeIndex("Challenges", "challenges_trainer_id");
    } catch (e) {}
    try {
      await queryInterface.removeIndex("Challenges", "challenges_status");
    } catch (e) {}
    try {
      await queryInterface.removeIndex("Challenges", "challenges_type");
    } catch (e) {}
    try {
      await queryInterface.removeIndex("Challenges", "challenges_difficulty");
    } catch (e) {}
    try {
      await queryInterface.removeIndex("Challenges", "challenges_is_public");
    } catch (e) {}
    try {
      await queryInterface.removeIndex("Challenges", "challenges_is_trainer_created");
    } catch (e) {}

    await queryInterface.dropTable("Challenges");
  },
};
