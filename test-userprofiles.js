require('dotenv').config();
const { UserProfile, User } = require('./src/models');

async function checkUserProfiles() {
    try {
        console.log('Checking UserProfile data...');

        const profileCount = await UserProfile.count();
        console.log('UserProfile count:', profileCount);

        const userCount = await User.count();
        console.log('User count:', userCount);

        if (profileCount > 0) {
            const totalXp = await UserProfile.sum('totalXp');
            const totalChallenges = await UserProfile.sum('challengesCompleted');
            const proCount = await UserProfile.count({ where: { subscriptionTier: 'pro' } });

            console.log('Total XP:', totalXp);
            console.log('Total Challenges Completed:', totalChallenges);
            console.log('Pro Subscriptions:', proCount);

            // Show a few sample records
            const samples = await UserProfile.findAll({
                limit: 3,
                include: [{ model: User, attributes: ['phone'] }]
            });
            console.log('Sample UserProfiles:', JSON.stringify(samples, null, 2));
        } else {
            console.log('No UserProfile records found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUserProfiles();

