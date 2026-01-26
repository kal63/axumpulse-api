'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()

    await queryInterface.bulkInsert('subscription_plans', [
      {
        name: 'Silver Package',
        level: 'silver',
        dailyPrice: 20.00,
        monthlyPrice: 600.00,
        threeMonthPrice: 1800.00,
        sixMonthPrice: 3600.00,
        nineMonthPrice: 5400.00,
        yearlyPrice: 7300.00,
        discounts: JSON.stringify({
          monthly: 5,
          threeMonth: 10,
          sixMonth: 12,
          nineMonth: 15,
          yearly: 20
        }),
        features: JSON.stringify([
          'Beginner-friendly workouts',
          'Basic nutrition guidance',
          'Habit tracking',
          'Multilingual AI coaching'
        ]),
        minDuration: 'daily',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Gold Package',
        level: 'gold',
        dailyPrice: 50.00,
        monthlyPrice: 1500.00,
        threeMonthPrice: 4500.00,
        sixMonthPrice: 9000.00,
        nineMonthPrice: 13500.00,
        yearlyPrice: 18000.00,
        discounts: JSON.stringify({
          monthly: 0,
          threeMonth: 5,
          sixMonth: 10,
          nineMonth: 15,
          yearly: 20
        }),
        features: JSON.stringify([
          'Structured workout programs',
          'Progressive routines',
          'Expanded content access',
          'Enhanced AI-driven personalization',
          '1 trainer lead scheduled event per month',
          '1 trainer consultancy per month',
          '1 gym activity with trainer per month'
        ]),
        minDuration: 'monthly',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Diamond Package',
        level: 'diamond',
        dailyPrice: 100.00,
        monthlyPrice: 3000.00,
        threeMonthPrice: 9000.00,
        sixMonthPrice: 18000.00,
        nineMonthPrice: 27000.00,
        yearlyPrice: 36000.00,
        discounts: JSON.stringify({
          monthly: 0,
          threeMonth: 0,
          sixMonth: 10,
          nineMonth: 15,
          yearly: 20
        }),
        features: JSON.stringify([
          'High-intensity programs',
          'Advanced performance tracking',
          'Specialized workouts',
          'Deeper training insights powered by AI analytics',
          '1 trainer lead scheduled event per month',
          '1 gym activity with trainer per month',
          '1 trainer consultancy per month',
          '1 doctor consultancy per month'
        ]),
        minDuration: 'threeMonth',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Platinum Package',
        level: 'platinum',
        dailyPrice: 200.00,
        monthlyPrice: 6000.00,
        threeMonthPrice: 18000.00,
        sixMonthPrice: 36000.00,
        nineMonthPrice: 54000.00,
        yearlyPrice: 72000.00,
        discounts: JSON.stringify({
          monthly: 0,
          threeMonth: 0,
          sixMonth: 10,
          nineMonth: 15,
          yearly: 20
        }),
        features: JSON.stringify([
          'Full access to all Compound 360 content',
          'Priority AI coaching',
          'Dedicated trainer support',
          'Medical doctor consultations',
          '1 trainer lead scheduled event per month',
          '4 gym activities with trainer per month',
          'Unlimited doctor session consultancy',
          'Unlimited trainer session'
        ]),
        minDuration: 'threeMonth',
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscription_plans', null, {})
  }
};
