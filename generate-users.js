#!/usr/bin/env node

/**
 * User Generation Script for AxumPulse API
 * 
 * This script:
 * 1. Generates multiple users with Ethiopian phone numbers
 * 2. Sets isTrainer and isAdmin to false for all users
 * 3. Sets status to 'active' for all users
 * 4. Creates realistic user data with names and emails
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// Ethiopian names for realistic user generation
const ETHIOPIAN_NAMES = {
    male: [
        'Abebe Kebede', 'Kebede Abebe', 'Tadesse Alemayehu', 'Alemayehu Tadesse',
        'Mengistu Haile', 'Haile Mengistu', 'Tesfaye Gebre', 'Gebre Tesfaye',
        'Dawit Solomon', 'Solomon Dawit', 'Yonas Michael', 'Michael Yonas',
        'Daniel Assefa', 'Assefa Daniel', 'Elias Tewodros', 'Tewodros Elias',
        'Samuel Bekele', 'Bekele Samuel', 'David Tilahun', 'Tilahun David',
        'Yohannes Getachew', 'Getachew Yohannes', 'Mikias Tsegaye', 'Tsegaye Mikias',
        'Henok Yared', 'Yared Henok', 'Nahom Teshome', 'Teshome Nahom'
    ],
    female: [
        'Aster Tsehay', 'Tsehay Aster', 'Meron Tekle', 'Tekle Meron',
        'Sara Bekele', 'Bekele Sara', 'Hirut Alemayehu', 'Alemayehu Hirut',
        'Marta Tadesse', 'Tadesse Marta', 'Kebede Genet', 'Genet Kebede',
        'Tigist Haile', 'Haile Tigist', 'Meskel Tesfaye', 'Tesfaye Meskel',
        'Selam Gebre', 'Gebre Selam', 'Kidan Solomon', 'Solomon Kidan',
        'Meron Michael', 'Michael Meron', 'Hanna Yonas', 'Yonas Hanna',
        'Ruth Dawit', 'Dawit Ruth', 'Grace Assefa', 'Assefa Grace',
        'Faith Tewodros', 'Tewodros Faith', 'Hope Elias', 'Elias Hope'
    ]
};

// Ethiopian phone number prefixes (2 digits for 13-character total)
const PHONE_PREFIXES = [
    '91', '92', '93', '94', '95', '96', '97', '98', '99'
];

class UserGenerator {
    constructor() {
        this.generatedUsers = [];
        this.usedPhones = new Set();
        this.usedEmails = new Set();
    }

    /**
     * Generate a unique Ethiopian phone number
     */
    generatePhoneNumber() {
        let phone;
        let attempts = 0;

        do {
            const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
            // Generate 7 random digits for the suffix (total 13 chars: +251 + 2 + 7)
            const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
            phone = `+251${prefix}${suffix}`;
            attempts++;
        } while (this.usedPhones.has(phone) && attempts < 100);

        if (attempts >= 100) {
            throw new Error('Unable to generate unique phone number');
        }

        this.usedPhones.add(phone);
        return phone;
    }

    /**
     * Generate a unique email address
     */
    generateEmail(name) {
        const cleanName = name.toLowerCase().replace(/\s+/g, '');
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'ethionet.et'];
        const domain = domains[Math.floor(Math.random() * domains.length)];

        let email;
        let attempts = 0;

        do {
            const suffix = attempts > 0 ? Math.floor(Math.random() * 1000) : '';
            email = `${cleanName}${suffix}@${domain}`;
            attempts++;
        } while (this.usedEmails.has(email) && attempts < 100);

        if (attempts >= 100) {
            throw new Error('Unable to generate unique email');
        }

        this.usedEmails.add(email);
        return email;
    }

    /**
     * Generate a random date of birth (18-65 years old)
     */
    generateDateOfBirth() {
        const now = new Date();
        const minAge = 18;
        const maxAge = 65;

        const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
        const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());

        const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
        return new Date(randomTime).toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }

    /**
     * Generate a single user
     */
    generateUser() {
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const name = ETHIOPIAN_NAMES[gender][Math.floor(Math.random() * ETHIOPIAN_NAMES[gender].length)];
        const phone = this.generatePhoneNumber();
        const email = this.generateEmail(name);
        const dateOfBirth = this.generateDateOfBirth();

        return {
            phone,
            email,
            name,
            dateOfBirth,
            gender,
            isTrainer: false,
            isAdmin: false,
            status: 'active',
            lastLoginAt: null,
            lastActiveAt: null
        };
    }

    /**
     * Generate multiple users
     */
    generateUsers(count = 50) {
        console.log(`👥 Generating ${count} users...`);

        for (let i = 0; i < count; i++) {
            try {
                const user = this.generateUser();
                this.generatedUsers.push(user);

                if ((i + 1) % 10 === 0) {
                    console.log(`✅ Generated ${i + 1}/${count} users`);
                }
            } catch (error) {
                console.error(`❌ Failed to generate user ${i + 1}:`, error.message);
            }
        }

        console.log(`✅ Successfully generated ${this.generatedUsers.length} users`);
        return this.generatedUsers;
    }

    /**
     * Save users to a JSON file for review
     */
    saveUsersToFile() {
        const filename = `generated-users-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(__dirname, filename);

        fs.writeFileSync(filepath, JSON.stringify(this.generatedUsers, null, 2));
        console.log(`📁 Users saved to: ${filename}`);
        return filepath;
    }

    /**
     * Create users in the database via API (if there's a user creation endpoint)
     */
    async createUsersInDatabase() {
        console.log('🚀 Creating users in database...');

        // Note: This would require a user creation API endpoint
        // For now, we'll just save to file and show the data
        console.log('📝 Note: Direct database insertion would require a user creation API endpoint');
        console.log('📁 Users have been saved to JSON file for manual insertion or seeder creation');

        return this.generatedUsers;
    }

    /**
     * Generate a seeder file for the users
     */
    generateSeederFile() {
        const usersData = this.generatedUsers.map(user => ({
            phone: user.phone,
            email: user.email,
            name: user.name,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            isTrainer: false,
            isAdmin: false,
            status: 'active',
            lastLoginAt: null,
            lastActiveAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const seederContent = `'use strict';

const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Hash password for all users
        const userPassword = await bcrypt.hash('user123', 10);

        const users = ${JSON.stringify(usersData, null, 8)};

        // Set password hash for all users
        users.forEach(user => {
            user.passwordHash = userPassword;
        });

        await queryInterface.bulkInsert('users', users, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', {
            phone: {
                [Sequelize.Op.in]: ${JSON.stringify(this.generatedUsers.map(u => u.phone))}
            }
        }, {});
    }
};`;

        const filename = `20241024000001-generated-users.js`;
        const filepath = path.join(__dirname, 'seeders', filename);

        // Ensure seeders directory exists
        const seedersDir = path.join(__dirname, 'seeders');
        if (!fs.existsSync(seedersDir)) {
            fs.mkdirSync(seedersDir, { recursive: true });
        }

        fs.writeFileSync(filepath, seederContent);
        console.log(`📁 Seeder file created: seeders/${filename}`);
        return filepath;
    }

    /**
     * Print summary of generated users
     */
    printSummary() {
        console.log('\n📊 USER GENERATION SUMMARY');
        console.log('==========================');

        const maleCount = this.generatedUsers.filter(u => u.gender === 'male').length;
        const femaleCount = this.generatedUsers.filter(u => u.gender === 'female').length;

        console.log(`👥 Total Users: ${this.generatedUsers.length}`);
        console.log(`👨 Male: ${maleCount}`);
        console.log(`👩 Female: ${femaleCount}`);
        console.log(`📱 Unique Phones: ${this.usedPhones.size}`);
        console.log(`📧 Unique Emails: ${this.usedEmails.size}`);

        console.log('\n📋 Sample Users:');
        this.generatedUsers.slice(0, 5).forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.gender}) - ${user.phone} - ${user.email}`);
        });

        if (this.generatedUsers.length > 5) {
            console.log(`... and ${this.generatedUsers.length - 5} more users`);
        }
    }
}

// Main execution
async function main() {
    console.log('👥 AxumPulse User Generator');
    console.log('============================');

    const generator = new UserGenerator();

    try {
        // Generate users
        const userCount = process.argv[2] ? parseInt(process.argv[2]) : 50;
        generator.generateUsers(userCount);

        // Save to JSON file
        generator.saveUsersToFile();

        // Generate seeder file
        generator.generateSeederFile();

        // Print summary
        generator.printSummary();

        console.log('\n🎉 User generation completed!');
        console.log('📁 Check the generated files:');
        console.log('   - JSON file: generated-users-[date].json');
        console.log('   - Seeder file: seeders/20241024000001-generated-users.js');
        console.log('\n💡 To run the seeder: npm run db:seed');

    } catch (error) {
        console.error('\n💥 User generation failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserGenerator;
