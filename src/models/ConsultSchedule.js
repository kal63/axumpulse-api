'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsultSchedule extends Model {
    static associate(models) {
      ConsultSchedule.belongsTo(models.User, { foreignKey: 'providerId', as: 'provider' });
    }

    // Helper method to check if time ranges overlap
    static async checkOverlap(providerId, dayOfWeek, startTime, endTime, excludeId = null) {
      const { Op } = require('sequelize');
      const where = {
        providerId,
        dayOfWeek,
        status: 'active'
      };
      
      if (excludeId) {
        where.id = { [Op.ne]: excludeId };
      }

      const existing = await ConsultSchedule.findAll({ where });
      
      // Use timeToMinutes for consistent time comparison
      const newStart = ConsultSchedule.timeToMinutes(startTime);
      const newEnd = ConsultSchedule.timeToMinutes(endTime);
      
      // Check for overlap: (newStart < existingEnd) && (newEnd > existingStart)
      for (const schedule of existing) {
        const existingStart = ConsultSchedule.timeToMinutes(schedule.startTime);
        const existingEnd = ConsultSchedule.timeToMinutes(schedule.endTime);

        if ((newStart < existingEnd) && (newEnd > existingStart)) {
          return true; // Overlap found
        }
      }
      return false;
    }

    // Helper to convert time string to minutes for comparison
    static timeToMinutes(time) {
      if (typeof time === 'string') {
        const parts = time.split(':');
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 60 + minutes;
      }
      // Handle Date objects or other types
      if (time instanceof Date) {
        return time.getHours() * 60 + time.getMinutes();
      }
      return 0;
    }

    // Generate slots dynamically for a given week (returns slot objects, doesn't store them)
    async generateSlotsForWeekDynamic(weekStartDate) {
      const slots = [];
      
      // Parse weekStartDate - expect YYYY-MM-DD format
      let weekStartYear, weekStartMonth, weekStartDay;
      if (typeof weekStartDate === 'string') {
        [weekStartYear, weekStartMonth, weekStartDay] = weekStartDate.split('-').map(Number);
      } else if (weekStartDate instanceof Date) {
        weekStartYear = weekStartDate.getFullYear();
        weekStartMonth = weekStartDate.getMonth() + 1;
        weekStartDay = weekStartDate.getDate();
      } else {
        const weekStart = new Date(weekStartDate);
        weekStartYear = weekStart.getFullYear();
        weekStartMonth = weekStart.getMonth() + 1;
        weekStartDay = weekStart.getDate();
      }
      
      // Calculate target date: weekStart + dayOfWeek offset
      // weekStart is Monday (day 1), dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
      // For Monday (1): offset = 0, Sunday (0): offset = 6
      const dayOfWeek = this.dayOfWeek;
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6, Monday = 0, etc.
      
      // Calculate target date directly in UTC to avoid timezone issues
      // weekStartDate is in YYYY-MM-DD format, treat it as a calendar date (not a datetime)
      const targetDayOffset = weekStartDay + offset;
      
      // Create a UTC date for the target day at midnight to get the correct calendar date
      // This ensures the date is preserved regardless of server timezone
      const targetDateUTC = new Date(Date.UTC(weekStartYear, weekStartMonth - 1, targetDayOffset, 0, 0, 0, 0));
      const targetYear = targetDateUTC.getUTCFullYear();
      const targetMonth = targetDateUTC.getUTCMonth(); // 0-indexed
      const targetDay = targetDateUTC.getUTCDate(); // Actual day of month (handles month boundaries)

      // Parse start and end times (these are local times in the schedule's timezone)
      const startTimeStr = typeof this.startTime === 'string' ? this.startTime : String(this.startTime);
      const endTimeStr = typeof this.endTime === 'string' ? this.endTime : String(this.endTime);
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);

      // Get timezone offset (default UTC+3)
      let timezoneOffsetHours = 3;
      if (this.timezone) {
        const tzMatch = this.timezone.match(/^([+-])(\d{2}):?(\d{2})?$/);
        if (tzMatch) {
          const sign = tzMatch[1] === '+' ? 1 : -1;
          const hours = parseInt(tzMatch[2], 10);
          timezoneOffsetHours = sign * hours;
        }
      }

      // Store times in UTC by subtracting the timezone offset
      // This ensures times display correctly when the browser converts UTC to local time
      // Example: Saturday 2:00 AM local (UTC+3) -> Friday 23:00 UTC
      // When displayed in UTC+3: Friday 23:00 UTC + 3 hours = Saturday 2:00 AM local (correct!)
      // Note: The UTC date may shift to the previous day, but the frontend will handle filtering correctly
      let utcStartHours = startHours - timezoneOffsetHours;
      let utcStartDay = targetDay;
      let utcEndHours = endHours - timezoneOffsetHours;
      let utcEndDay = targetDay;

      // Handle day rollover when converting to UTC (subtracting offset)
      if (utcStartHours < 0) {
        utcStartHours += 24;
        utcStartDay -= 1;
      } else if (utcStartHours >= 24) {
        utcStartHours -= 24;
        utcStartDay += 1;
      }

      if (utcEndHours < 0) {
        utcEndHours += 24;
        utcEndDay -= 1;
      } else if (utcEndHours >= 24) {
        utcEndHours -= 24;
        utcEndDay += 1;
      }

      // Create dates in UTC with adjusted times
      const startDateTime = new Date(Date.UTC(targetYear, targetMonth, utcStartDay, utcStartHours, startMinutes, 0, 0));
      let endDateTime = new Date(Date.UTC(targetYear, targetMonth, utcEndDay, utcEndHours, endMinutes, 0, 0));

      // Handle case where end time is on the next day (in addition to timezone conversion)
      if (endDateTime <= startDateTime) {
        endDateTime = new Date(Date.UTC(targetYear, targetMonth, utcEndDay + 1, utcEndHours, endMinutes, 0, 0));
      }

      // Handle case where end time is on the next day
      if (endDateTime <= startDateTime) {
        endDateTime = new Date(Date.UTC(targetYear, targetMonth, targetDay + 1, endHours, endMinutes, 0, 0));
      }

      // Generate slots
      let currentSlotStart = new Date(startDateTime);
      while (currentSlotStart < endDateTime) {
        const currentSlotEnd = new Date(currentSlotStart);
        currentSlotEnd.setUTCMinutes(currentSlotEnd.getUTCMinutes() + this.duration);

        if (currentSlotEnd > endDateTime) {
          break;
        }
        
        slots.push({
          id: null, // No ID since we're not storing
          providerId: this.providerId,
          startAt: currentSlotStart.toISOString(),
          endAt: currentSlotEnd.toISOString(),
          type: this.type,
          timezone: this.timezone,
          status: 'open',
          booking: null
        });

        currentSlotStart = new Date(currentSlotEnd);
      }

      return slots;
    }

    // Generate ConsultSlot records for a given week (legacy method, kept for backward compatibility)
    async generateSlotsForWeek(weekStartDate, ConsultSlot) {
      const slots = [];
      const { Op } = require('sequelize');
      
      // Parse weekStartDate - expect YYYY-MM-DD format
      // We'll work with date strings directly to avoid timezone issues
      let weekStartYear, weekStartMonth, weekStartDay;
      if (typeof weekStartDate === 'string') {
        [weekStartYear, weekStartMonth, weekStartDay] = weekStartDate.split('-').map(Number);
      } else if (weekStartDate instanceof Date) {
        // Get date components as local date (not UTC) to preserve the calendar date
        weekStartYear = weekStartDate.getFullYear();
        weekStartMonth = weekStartDate.getMonth() + 1; // Convert back to 1-indexed
        weekStartDay = weekStartDate.getDate();
      } else {
        const weekStart = new Date(weekStartDate);
        weekStartYear = weekStart.getFullYear();
        weekStartMonth = weekStart.getMonth() + 1;
        weekStartDay = weekStart.getDate();
      }
      
      // Calculate target date: weekStart + dayOfWeek offset
      // weekStart is Monday (day 1), dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
      // For Monday (1): offset = 0, Sunday (0): offset = 6
      const dayOfWeek = this.dayOfWeek;
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6, Monday = 0, etc.
      
      // Calculate target date components
      const targetDay = weekStartDay + offset;
      // Create a temporary date to handle month/year rollover correctly
      const tempDate = new Date(weekStartYear, weekStartMonth - 1, targetDay);
      const targetYear = tempDate.getFullYear();
      const targetMonth = tempDate.getMonth(); // 0-indexed for Date constructor

      // Parse start and end times (handle both HH:MM:SS and HH:MM formats)
      const startTimeStr = typeof this.startTime === 'string' ? this.startTime : String(this.startTime);
      const endTimeStr = typeof this.endTime === 'string' ? this.endTime : String(this.endTime);
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);

      // Create dates in UTC directly
      // Since we're now using UTC timezone in Sequelize, we create dates in UTC
      // To represent Dec 26 23:00 in UTC+3, we store it as Dec 26 20:00 UTC (23:00 - 3 hours)
      // When displaying, we'll convert back to local time on the frontend
      const startDateTime = new Date(Date.UTC(targetYear, targetMonth, tempDate.getDate(), startHours - 3, startMinutes, 0, 0));
      const endDateTime = new Date(Date.UTC(targetYear, targetMonth, tempDate.getDate(), endHours - 3, endMinutes, 0, 0));

      // Handle case where end time is on the next day (e.g., 23:30 extends past midnight)
      if (endDateTime <= startDateTime) {
        endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
      }

      // Generate slots
      let currentSlotStart = new Date(startDateTime);
      while (currentSlotStart < endDateTime) {
        const currentSlotEnd = new Date(currentSlotStart);
        currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + this.duration);

        // Don't create slot if it would exceed end time
        if (currentSlotEnd > endDateTime) {
          break;
        }
        
        slots.push({
          providerId: this.providerId,
          startAt: new Date(currentSlotStart),
          endAt: new Date(currentSlotEnd),
          type: this.type,
          timezone: this.timezone,
          status: 'open'
        });

        // Move to next slot
        currentSlotStart = new Date(currentSlotEnd);
      }

      return slots;
    }
  }

  ConsultSchedule.init(
    {
      providerId: { type: DataTypes.INTEGER, allowNull: false },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 6
        }
      },
      startTime: { type: DataTypes.TIME, allowNull: false },
      endTime: { type: DataTypes.TIME, allowNull: false },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
          min: 1
        }
      },
      type: {
        type: DataTypes.ENUM('quick', 'full', 'follow_up'),
        allowNull: false,
        defaultValue: 'quick'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      timezone: { type: DataTypes.STRING(64), allowNull: true }
    },
    {
      sequelize,
      modelName: 'ConsultSchedule',
      tableName: 'consult_schedules',
      underscored: false,
      indexes: [
        { fields: ['providerId'] },
        { fields: ['dayOfWeek'] },
        { fields: ['status'] },
        { fields: ['providerId', 'dayOfWeek'] }
      ],
      hooks: {
        beforeCreate: async (schedule, options) => {
          // Ensure times are strings for comparison
          const startTimeStr = typeof schedule.startTime === 'string' 
            ? schedule.startTime 
            : String(schedule.startTime);
          const endTimeStr = typeof schedule.endTime === 'string'
            ? schedule.endTime
            : String(schedule.endTime);
          
          // Validate endTime > startTime
          const startMins = ConsultSchedule.timeToMinutes(startTimeStr);
          const endMins = ConsultSchedule.timeToMinutes(endTimeStr);
          if (endMins <= startMins) {
            throw new Error('endTime must be after startTime');
          }

          // Check for overlaps
          const hasOverlap = await ConsultSchedule.checkOverlap(
            schedule.providerId,
            schedule.dayOfWeek,
            startTimeStr,
            endTimeStr
          );
          if (hasOverlap) {
            throw new Error('Time range overlaps with existing schedule for this day');
          }
        },
        beforeUpdate: async (schedule, options) => {
          // Validate endTime > startTime if times are being updated
          if (schedule.changed('startTime') || schedule.changed('endTime')) {
            // Ensure times are strings for comparison
            const startTimeStr = typeof schedule.startTime === 'string'
              ? schedule.startTime
              : String(schedule.startTime);
            const endTimeStr = typeof schedule.endTime === 'string'
              ? schedule.endTime
              : String(schedule.endTime);
            
            const startMins = ConsultSchedule.timeToMinutes(startTimeStr);
            const endMins = ConsultSchedule.timeToMinutes(endTimeStr);
            if (endMins <= startMins) {
              throw new Error('endTime must be after startTime');
            }

            // Check for overlaps (excluding current record)
            const hasOverlap = await ConsultSchedule.checkOverlap(
              schedule.providerId,
              schedule.dayOfWeek,
              startTimeStr,
              endTimeStr,
              schedule.id
            );
            if (hasOverlap) {
              throw new Error('Time range overlaps with existing schedule for this day');
            }
          }
        }
      }
    }
  );

  return ConsultSchedule;
};

