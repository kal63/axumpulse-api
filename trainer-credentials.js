/**
 * Trainer Credentials Configuration
 * 
 * These are the actual trainer credentials from the database seeder.
 * Both trainers have isTrainer = true and use password 'trainer123'
 */

module.exports = [
    { phone: '+251912345678', password: 'trainer123' }, // Sara Bekele
    { phone: '+251923456789', password: 'trainer123' }, // Meron Tekle
];

/**
 * Available Trainers:
 * 1. Sara Bekele (+251912345678) - trainer1@axumpulse.com
 * 2. Meron Tekle (+251923456789) - trainer2@axumpulse.com
 * 
 * Both use password: 'trainer123'
 * 
 * To run content generation:
 * npm run generate-content
 */
