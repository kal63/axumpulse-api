require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAdminRoutesWithData() {
    try {
        console.log('🧪 Testing Admin Routes with Seeded Data...\n');

        // Test 1: Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            phone: '+251911234567',
            password: 'admin123'
        });

        const { token } = loginResponse.data.data;
        console.log('✅ Admin login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // Test 2: Get admin stats
        console.log('\n2. Testing admin stats...');
        const statsResponse = await axios.get(`${BASE_URL}/api/v1/admin/stats`, { headers });
        console.log('✅ Admin stats:', statsResponse.data.data);

        // Test 3: Get languages
        console.log('\n3. Testing languages endpoint...');
        const languagesResponse = await axios.get(`${BASE_URL}/api/v1/admin/languages`, { headers });
        console.log('✅ Languages:', languagesResponse.data.data.items.length, 'items');

        // Test 4: Get trainers
        console.log('\n4. Testing trainers endpoint...');
        const trainersResponse = await axios.get(`${BASE_URL}/api/v1/admin/trainers`, { headers });
        console.log('✅ Trainers:', trainersResponse.data.data.items.length, 'items');

        // Test 5: Get users
        console.log('\n5. Testing users endpoint...');
        const usersResponse = await axios.get(`${BASE_URL}/api/v1/admin/users`, { headers });
        console.log('✅ Users:', usersResponse.data.data.items.length, 'items');

        // Test 6: Get challenges
        console.log('\n6. Testing challenges endpoint...');
        const challengesResponse = await axios.get(`${BASE_URL}/api/v1/admin/challenges`, { headers });
        console.log('✅ Challenges:', challengesResponse.data.data.items.length, 'items');

        // Test 7: Get rewards
        console.log('\n7. Testing rewards endpoint...');
        const rewardsResponse = await axios.get(`${BASE_URL}/api/v1/admin/rewards`, { headers });
        console.log('✅ Rewards:', rewardsResponse.data.data.items.length, 'items');

        // Test 8: Test trainer verification
        console.log('\n8. Testing trainer verification...');
        const verifyResponse = await axios.post(`${BASE_URL}/api/v1/admin/trainers/3/verify`,
            { verified: true },
            { headers }
        );
        console.log('✅ Trainer verification successful');

        // Test 9: Test language toggle
        console.log('\n9. Testing language toggle...');
        const toggleResponse = await axios.post(`${BASE_URL}/api/v1/admin/languages/1/toggle`,
            { isActive: false },
            { headers }
        );
        console.log('✅ Language toggle successful');

        // Test 10: Test user admin toggle
        console.log('\n10. Testing user admin toggle...');
        const userAdminResponse = await axios.post(`${BASE_URL}/api/v1/admin/users/4/admin`,
            { isAdmin: true },
            { headers }
        );
        console.log('✅ User admin toggle successful');

        // Test 11: Test user status change
        console.log('\n11. Testing user status change...');
        const userStatusResponse = await axios.post(`${BASE_URL}/api/v1/admin/users/4/status`,
            { status: 'blocked' },
            { headers }
        );
        console.log('✅ User status change successful');

        // Test 12: Test challenge creation
        console.log('\n12. Testing challenge creation...');
        const newChallenge = {
            title: 'Test Challenge',
            description: 'A test challenge created via API',
            kind: 'daily',
            ruleJson: { target: 'steps', frequency: 'daily', amount: 5000, points: 50 },
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            active: true
        };
        const createChallengeResponse = await axios.post(`${BASE_URL}/api/v1/admin/challenges`,
            newChallenge,
            { headers }
        );
        console.log('✅ Challenge creation successful');

        // Test 13: Test challenge update
        console.log('\n13. Testing challenge update...');
        const challengeId = createChallengeResponse.data.data.challenge.id;
        const updateChallengeResponse = await axios.put(`${BASE_URL}/api/v1/admin/challenges/${challengeId}`,
            { title: 'Updated Test Challenge' },
            { headers }
        );
        console.log('✅ Challenge update successful');

        // Test 14: Test reward creation
        console.log('\n14. Testing reward creation...');
        const newReward = {
            title: 'Test Reward',
            costXp: 100,
            active: true,
            stock: 50
        };
        const createRewardResponse = await axios.post(`${BASE_URL}/api/v1/admin/rewards`,
            newReward,
            { headers }
        );
        console.log('✅ Reward creation successful');

        // Test 15: Test reward update
        console.log('\n15. Testing reward update...');
        const rewardId = createRewardResponse.data.data.reward.id;
        const updateRewardResponse = await axios.put(`${BASE_URL}/api/v1/admin/rewards/${rewardId}`,
            { title: 'Updated Test Reward' },
            { headers }
        );
        console.log('✅ Reward update successful');

        // Test 16: Test moderation endpoints (placeholders)
        console.log('\n16. Testing moderation endpoints...');
        const moderationResponse = await axios.get(`${BASE_URL}/api/v1/admin/moderation`, { headers });
        console.log('✅ Moderation list successful');

        const moderationDetailResponse = await axios.get(`${BASE_URL}/api/v1/admin/moderation/workout/1`, { headers });
        console.log('✅ Moderation detail successful');

        const moderationApproveResponse = await axios.post(`${BASE_URL}/api/v1/admin/moderation/workout/1/approve`,
            {},
            { headers }
        );
        console.log('✅ Moderation approve successful');

        const moderationRejectResponse = await axios.post(`${BASE_URL}/api/v1/admin/moderation/workout/1/reject`,
            { reason: 'Test rejection' },
            { headers }
        );
        console.log('✅ Moderation reject successful');

        // Test 17: Test pagination and filtering
        console.log('\n17. Testing pagination and filtering...');
        const paginatedUsers = await axios.get(`${BASE_URL}/api/v1/admin/users?page=1&pageSize=2`, { headers });
        console.log('✅ Pagination test successful:', paginatedUsers.data.data.items.length, 'items');

        const filteredTrainers = await axios.get(`${BASE_URL}/api/v1/admin/trainers?verified=true`, { headers });
        console.log('✅ Filtering test successful:', filteredTrainers.data.data.items.length, 'verified trainers');

        const searchUsers = await axios.get(`${BASE_URL}/api/v1/admin/users?q=251911234`, { headers });
        console.log('✅ Search test successful:', searchUsers.data.data.items.length, 'matching users');

        // Test 18: Test challenge deletion
        console.log('\n18. Testing challenge deletion...');
        const deleteChallengeResponse = await axios.delete(`${BASE_URL}/api/v1/admin/challenges/${challengeId}`, { headers });
        console.log('✅ Challenge deletion successful');

        // Test 19: Test reward deletion
        console.log('\n19. Testing reward deletion...');
        const deleteRewardResponse = await axios.delete(`${BASE_URL}/api/v1/admin/rewards/${rewardId}`, { headers });
        console.log('✅ Reward deletion successful');

        console.log('\n🎉 All admin routes are working perfectly with seeded data!');
        console.log('\n📊 Summary of tested endpoints:');
        console.log('   ✅ Authentication (login)');
        console.log('   ✅ Admin stats');
        console.log('   ✅ Languages (list, toggle)');
        console.log('   ✅ Trainers (list, verify)');
        console.log('   ✅ Users (list, admin toggle, status change)');
        console.log('   ✅ Challenges (list, create, update, delete)');
        console.log('   ✅ Rewards (list, create, update, delete)');
        console.log('   ✅ Moderation (list, detail, approve, reject)');
        console.log('   ✅ Pagination and filtering');
        console.log('   ✅ Search functionality');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAdminRoutesWithData();
