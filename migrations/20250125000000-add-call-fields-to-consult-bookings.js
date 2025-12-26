'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add call-related fields to consult_bookings table
    const tableName = 'consult_bookings';
    
    try {
      const tableInfo = await queryInterface.describeTable(tableName);
      
      // Add callStatus field
      if (!tableInfo.callStatus) {
        await queryInterface.addColumn(tableName, 'callStatus', {
          type: Sequelize.ENUM('not_started', 'ringing', 'in_progress', 'ended'),
          allowNull: false,
          defaultValue: 'not_started'
        });
        await queryInterface.addIndex(tableName, ['callStatus'], { 
          name: 'consult_bookings_call_status_idx' 
        });
        console.log('Added callStatus column to consult_bookings');
      }
      
      // Add callRoomId field
      if (!tableInfo.callRoomId) {
        await queryInterface.addColumn(tableName, 'callRoomId', {
          type: Sequelize.STRING(255),
          allowNull: true,
          unique: true
        });
        await queryInterface.addIndex(tableName, ['callRoomId'], { 
          name: 'consult_bookings_call_room_id_idx' 
        });
        console.log('Added callRoomId column to consult_bookings');
      }
      
      // Add callStartedAt field
      if (!tableInfo.callStartedAt) {
        await queryInterface.addColumn(tableName, 'callStartedAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('Added callStartedAt column to consult_bookings');
      }
      
      // Add callEndedAt field
      if (!tableInfo.callEndedAt) {
        await queryInterface.addColumn(tableName, 'callEndedAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('Added callEndedAt column to consult_bookings');
      }
    } catch (error) {
      // Try with capitalized table name
      try {
        const tableInfo = await queryInterface.describeTable('ConsultBookings');
        
        if (!tableInfo.callStatus) {
          await queryInterface.addColumn('ConsultBookings', 'callStatus', {
            type: Sequelize.ENUM('not_started', 'ringing', 'in_progress', 'ended'),
            allowNull: false,
            defaultValue: 'not_started'
          });
          await queryInterface.addIndex('ConsultBookings', ['callStatus'], { 
            name: 'consult_bookings_call_status_idx' 
          });
        }
        
        if (!tableInfo.callRoomId) {
          await queryInterface.addColumn('ConsultBookings', 'callRoomId', {
            type: Sequelize.STRING(255),
            allowNull: true,
            unique: true
          });
          await queryInterface.addIndex('ConsultBookings', ['callRoomId'], { 
            name: 'consult_bookings_call_room_id_idx' 
          });
        }
        
        if (!tableInfo.callStartedAt) {
          await queryInterface.addColumn('ConsultBookings', 'callStartedAt', {
            type: Sequelize.DATE,
            allowNull: true
          });
        }
        
        if (!tableInfo.callEndedAt) {
          await queryInterface.addColumn('ConsultBookings', 'callEndedAt', {
            type: Sequelize.DATE,
            allowNull: true
          });
        }
      } catch (e) {
        console.error('Error adding call fields:', e);
        throw e;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'consult_bookings';
    
    try {
      await queryInterface.removeIndex(tableName, 'consult_bookings_call_status_idx');
      await queryInterface.removeIndex(tableName, 'consult_bookings_call_room_id_idx');
      await queryInterface.removeColumn(tableName, 'callStatus');
      await queryInterface.removeColumn(tableName, 'callRoomId');
      await queryInterface.removeColumn(tableName, 'callStartedAt');
      await queryInterface.removeColumn(tableName, 'callEndedAt');
    } catch (error) {
      try {
        await queryInterface.removeIndex('ConsultBookings', 'consult_bookings_call_status_idx');
        await queryInterface.removeIndex('ConsultBookings', 'consult_bookings_call_room_id_idx');
        await queryInterface.removeColumn('ConsultBookings', 'callStatus');
        await queryInterface.removeColumn('ConsultBookings', 'callRoomId');
        await queryInterface.removeColumn('ConsultBookings', 'callStartedAt');
        await queryInterface.removeColumn('ConsultBookings', 'callEndedAt');
      } catch (e) {
        console.error('Error removing call fields:', e);
        throw e;
      }
    }
  }
};

