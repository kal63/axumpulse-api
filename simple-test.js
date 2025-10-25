/**
 * Simple test to verify authentication and basic routes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
const CREDENTIALS = { phone: '+251934567890', password: 'user123' };

async function simpleTest() {
    console.log('🧪 Simple Authentication Test\n');

    try {
        // 1. Login
        console.log('1. Testing login...');
        const login = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
        const token = login.data.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', token.substring(0, 20) + '...');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Test profile route
        console.log('\n2. Testing profile route...');
        try {
            const profile = await axios.get(`${BASE_URL}/user/profile`, { headers });
            console.log('✅ Profile route successful');
            console.log('   User:', profile.data.data.user.name);
            console.log('   XP:', profile.data.data.user.xp);
            console.log('   Level:', profile.data.data.user.level);
        } catch (error) {
            console.log('❌ Profile route failed:', error.response?.status, error.response?.data?.error?.message);
        }

        // 3. Test content list
        console.log('\n3. Testing content list...');
        try {
            const content = await axios.get(`${BASE_URL}/user/content`, { headers });
            console.log('✅ Content list successful');
            console.log('   Items:', content.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Content list failed:', error.response?.status, error.response?.data?.error?.message);
        }

        // 4. Test content categories
        console.log('\n4. Testing content categories...');
        try {
            const categories = await axios.get(`${BASE_URL}/user/content/categories`, { headers });
            console.log('✅ Content categories successful');
            console.log('   Categories:', categories.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Content categories failed:', error.response?.status, error.response?.data?.error?.message);
        }

        // 5. Test workout plans
        console.log('\n5. Testing workout plans...');
        try {
            const workouts = await axios.get(`${BASE_URL}/user/workout-plans`, { headers });
            console.log('✅ Workout plans successful');
            console.log('   Items:', workouts.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Workout plans failed:', error.response?.status, error.response?.data?.error?.message);
        }

        // 6. Test challenges
        console.log('\n6. Testing challenges...');
        try {
            const challenges = await axios.get(`${BASE_URL}/user/challenges`, { headers });
            console.log('✅ Challenges successful');
            console.log('   Items:', challenges.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Challenges failed:', error.response?.status, error.response?.data?.error?.message);
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

simpleTest();



