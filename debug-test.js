/**
 * Debug test to identify issues with user routes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
const CREDENTIALS = { phone: '+251934567890', password: 'user123' };

async function debugTest() {
    console.log('🔍 Debug Test for User Routes\n');

    try {
        // 1. Test server connectivity
        console.log('1. Testing server connectivity...');
        try {
            const health = await axios.get(`http://localhost:4000/healthz`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server not running or health endpoint missing');
            console.log('   Make sure to run: npm start');
            return;
        }

        // 2. Test login
        console.log('\n2. Testing login...');
        try {
            const login = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
            console.log('✅ Login successful');
            console.log('   Token length:', login.data.data?.token?.length || 'No token');
            console.log('   User ID:', login.data.data?.user?.id || 'No user ID');
            console.log('   User role:', login.data.data?.user?.isTrainer ? 'trainer' : 'user');

            const token = login.data.data.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            // 3. Test a simple authenticated request
            console.log('\n3. Testing authenticated request...');
            try {
                const profile = await axios.get(`${BASE_URL}/user/profile`, { headers });
                console.log('✅ Profile request successful');
                console.log('   Status:', profile.status);
                console.log('   User name:', profile.data.data?.user?.name || 'No name');
            } catch (error) {
                console.log('❌ Profile request failed');
                console.log('   Status:', error.response?.status);
                console.log('   Error:', error.response?.data?.message || error.message);
                console.log('   Full response:', JSON.stringify(error.response?.data, null, 2));
            }

            // 4. Test content list
            console.log('\n4. Testing content list...');
            try {
                const content = await axios.get(`${BASE_URL}/user/content?page=1&limit=5`, { headers });
                console.log('✅ Content list successful');
                console.log('   Status:', content.status);
                console.log('   Items count:', content.data.data?.length || 0);
            } catch (error) {
                console.log('❌ Content list failed');
                console.log('   Status:', error.response?.status);
                console.log('   Error:', error.response?.data?.message || error.message);
                console.log('   Full response:', JSON.stringify(error.response?.data, null, 2));
            }

        } catch (error) {
            console.log('❌ Login failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data?.message || error.message);
            console.log('   Full response:', JSON.stringify(error.response?.data, null, 2));

            // Check if user exists
            console.log('\n🔍 Debugging login issue...');
            console.log('   Make sure:');
            console.log('   1. User exists in database with phone: +251934567890');
            console.log('   2. Password is: user123');
            console.log('   3. User is active (isActive = true)');
            console.log('   4. Database connection is working');
        }

    } catch (error) {
        console.error('💥 Debug test failed:', error.message);
    }
}

debugTest();
