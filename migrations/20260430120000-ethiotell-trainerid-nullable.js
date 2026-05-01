'use strict'

/** @type {import('sequelize-cli').Migration} */

async function dropTrainerFk(sequelize, table) {
    const [rows] = await sequelize.query(
        `
    SELECT kcu.CONSTRAINT_NAME AS name
    FROM information_schema.KEY_COLUMN_USAGE kcu
    WHERE kcu.TABLE_SCHEMA = DATABASE()
      AND kcu.TABLE_NAME = :table
      AND kcu.COLUMN_NAME = 'trainerId'
      AND kcu.REFERENCED_TABLE_NAME = 'users'
    `,
        { replacements: { table } }
    )
    const names = [...new Set((rows || []).map((r) => r.name).filter(Boolean))]
    for (const fk of names) {
        await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk}\``)
    }
}

module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize
        for (const table of ['ethiotell_product_plans', 'telco_pending_registrations']) {
            await dropTrainerFk(sequelize, table)
            await sequelize.query(`ALTER TABLE \`${table}\` MODIFY \`trainerId\` INT NULL`)
            await sequelize.query(`
        ALTER TABLE \`${table}\`
        ADD CONSTRAINT \`${table}_trainerId_users_fk\`
        FOREIGN KEY (\`trainerId\`) REFERENCES \`users\` (\`id\`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
      `)
        }
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize
        for (const table of ['ethiotell_product_plans', 'telco_pending_registrations']) {
            await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${table}_trainerId_users_fk\``)
            await sequelize.query(`ALTER TABLE \`${table}\` MODIFY \`trainerId\` INT NOT NULL`)
            await sequelize.query(`
        ALTER TABLE \`${table}\`
        ADD CONSTRAINT \`${table}_trainerId_users_fk\`
        FOREIGN KEY (\`trainerId\`) REFERENCES \`users\` (\`id\`)
        ON UPDATE CASCADE
        ON DELETE CASCADE
      `)
        }
    },
}
