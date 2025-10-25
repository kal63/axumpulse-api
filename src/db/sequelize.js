'use strict'

const { Sequelize } = require('sequelize')

const uri = process.env.MYSQL_URI
const sequelize = new Sequelize(uri, {
    logging: false,
    timezone: '+03:00',
})

module.exports = { sequelize }



