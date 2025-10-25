'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update existing challenges with null startTime/endTime to have random dates
    const challenges = await queryInterface.sequelize.query(
      'SELECT id FROM Challenges WHERE startTime IS NULL OR endTime IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const challenge of challenges) {
      // Generate random dates: startTime between 1-30 days ago, endTime 7-30 days from startTime
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const durationDays = Math.floor(Math.random() * 23) + 7; // 7-30 days duration

      const startTime = new Date();
      startTime.setDate(startTime.getDate() - daysAgo);

      const endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + durationDays);

      await queryInterface.sequelize.query(
        `UPDATE Challenges 
         SET startTime = :startTime, endTime = :endTime 
         WHERE id = :id`,
        {
          replacements: {
            startTime: startTime,
            endTime: endTime,
            id: challenge.id
          }
        }
      );
    }

    // Now make the columns NOT NULL
    await queryInterface.changeColumn('Challenges', 'startTime', {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'Challenge start time - required'
    });

    await queryInterface.changeColumn('Challenges', 'endTime', {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'Challenge end time - required'
    });

    // Add indexes for better performance on date queries
    await queryInterface.addIndex('Challenges', ['startTime'], {
      name: 'challenges_start_time_idx'
    });

    await queryInterface.addIndex('Challenges', ['endTime'], {
      name: 'challenges_end_time_idx'
    });

    // Add a check constraint to ensure endTime > startTime
    await queryInterface.sequelize.query(`
      ALTER TABLE Challenges 
      ADD CONSTRAINT check_challenge_dates 
      CHECK (endTime > startTime)
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE Challenges 
      DROP CONSTRAINT check_challenge_dates
    `);

    // Remove the indexes
    await queryInterface.removeIndex('Challenges', 'challenges_start_time_idx');
    await queryInterface.removeIndex('Challenges', 'challenges_end_time_idx');

    // Make columns nullable again
    await queryInterface.changeColumn('Challenges', 'startTime', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.changeColumn('Challenges', 'endTime', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};