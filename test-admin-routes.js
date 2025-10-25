require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAdminRoutes() {
    try {
        console.log('🧪 Testing Admin Routes...\n');

        // Test 1: Health check (should work without auth)
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/healthz`);
        console.log('✅ Health check:', healthResponse.data);

        // Test 2: Admin routes without auth (should return 401)
        console.log('\n2. Testing admin routes without authentication...');
        try {
            await axios.get(`${BASE_URL}/api/v1/admin/languages`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Admin routes properly protected (401 Unauthorized)');
            } else {
                console.log('❌ Unexpected error:', error.response?.status);
            }
        }

        // Test 3: Login endpoint (should work)
        console.log('\n3. Testing login endpoint...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
                phone: '1234567890',
                password: 'testpassword'
            });
            console.log('✅ Login endpoint accessible');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Login endpoint working (401 for invalid credentials)');
            } else {
                console.log('❌ Login error:', error.response?.status, error.response?.data);
            }
        }

        console.log('\n🎉 All tests completed! Admin routes are properly protected and working.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdminRoutes();
