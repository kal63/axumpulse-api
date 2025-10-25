/**
 * Comprehensive test file for all user routes
 * Tests all endpoints in the /user API folder
 * 
 * Usage: node test-user-routes.js
 * 
 * Credentials: +251934567890 / user123
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000/api/v1';
const TEST_CREDENTIALS = {
    phone: '+251934567890',
    password: 'user123'
};

let authToken = '';
let userId = '';

// Test data - using real IDs from database
const testData = {
    contentId: 7,        // "test vieo" (approved video)
    workoutPlanId: 6,    // "Upper Body Power 3" (approved, public)
    challengeId: 10,     // "adfadf" (pending - will test error handling)
    exerciseId: 4        // "Push ups"
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, params = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            }
        };

        if (data) config.data = data;
        if (params) config.params = params;

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, result, details = '') {
    testResults.total++;
    if (result.success) {
        testResults.passed++;
        console.log(`✅ ${testName} - PASSED`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName} - FAILED`);
        console.log(`   Error: ${result.error?.message || result.error}`);
        console.log(`   Status: ${result.status}`);
    }
    if (details) console.log(`   Details: ${details}`);

    testResults.details.push({
        name: testName,
        success: result.success,
        status: result.status,
        error: result.error,
        details
    });
}

// Authentication test
async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    const result = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);

    if (result.success && result.data.token) {
        authToken = result.data.token;
        userId = result.data.user.id;
        logTest('Login', result, `Token received, User ID: ${userId}`);
        return true;
    } else {
        logTest('Login', result);
        return false;
    }
}

// Content Routes Tests
async function testContentRoutes() {
    console.log('\n📹 Testing Content Routes...');

    // GET /user/content - List content
    const listResult = await makeRequest('GET', '/user/content', null, { page: 1, limit: 10 });
    logTest('GET /user/content (list)', listResult,
        listResult.success ? `Found ${listResult.data.data?.length || 0} items` : '');

    // GET /user/content/categories - Get categories
    const categoriesResult = await makeRequest('GET', '/user/content/categories');
    logTest('GET /user/content/categories', categoriesResult,
        categoriesResult.success ? `Found ${categoriesResult.data.data?.length || 0} categories` : '');

    // GET /user/content/:id - Get content detail
    const detailResult = await makeRequest('GET', `/user/content/${testData.contentId}`);
    logTest('GET /user/content/:id', detailResult,
        detailResult.success ? `Content: ${detailResult.data.data?.title || 'N/A'}` : '');
}

// Workout Plan Routes Tests
async function testWorkoutPlanRoutes() {
    console.log('\n💪 Testing Workout Plan Routes...');

    // GET /user/workout-plans - List workout plans
    const listResult = await makeRequest('GET', '/user/workout-plans', null, { page: 1, limit: 10 });
    logTest('GET /user/workout-plans (list)', listResult,
        listResult.success ? `Found ${listResult.data.data?.length || 0} workout plans` : '');

    // GET /user/workout-plans/categories - Get categories
    const categoriesResult = await makeRequest('GET', '/user/workout-plans/categories');
    logTest('GET /user/workout-plans/categories', categoriesResult,
        categoriesResult.success ? `Found ${categoriesResult.data.data?.length || 0} categories` : '');

    // GET /user/workout-plans/:id - Get workout plan detail
    const detailResult = await makeRequest('GET', `/user/workout-plans/${testData.workoutPlanId}`);
    logTest('GET /user/workout-plans/:id', detailResult,
        detailResult.success ? `Workout Plan: ${detailResult.data.data?.title || 'N/A'}` : '');
}

// Challenge Routes Tests
async function testChallengeRoutes() {
    console.log('\n🏆 Testing Challenge Routes...');

    // GET /user/challenges - List challenges
    const listResult = await makeRequest('GET', '/user/challenges', null, { page: 1, limit: 10 });
    logTest('GET /user/challenges (list)', listResult,
        listResult.success ? `Found ${listResult.data.data?.length || 0} challenges` : '');

    // GET /user/challenges/categories - Get categories
    const categoriesResult = await makeRequest('GET', '/user/challenges/categories');
    logTest('GET /user/challenges/categories', categoriesResult,
        categoriesResult.success ? `Found ${categoriesResult.data.data?.length || 0} categories` : '');

    // GET /user/challenges/:id - Get challenge detail
    const detailResult = await makeRequest('GET', `/user/challenges/${testData.challengeId}`);
    logTest('GET /user/challenges/:id', detailResult,
        detailResult.success ? `Challenge: ${detailResult.data.data?.title || 'N/A'}` : '');

    // GET /user/challenges/:id/leaderboard - Get leaderboard
    const leaderboardResult = await makeRequest('GET', `/user/challenges/${testData.challengeId}/leaderboard`);
    logTest('GET /user/challenges/:id/leaderboard', leaderboardResult,
        leaderboardResult.success ? `Leaderboard entries: ${leaderboardResult.data.data?.leaderboard?.length || 0}` : '');
}

// Engagement Routes Tests
async function testEngagementRoutes() {
    console.log('\n❤️ Testing Engagement Routes...');

    // POST /user/engagement/like - Like content
    const likeResult = await makeRequest('POST', '/user/engagement/like', {
        contentId: testData.contentId,
        type: 'content'
    });
    logTest('POST /user/engagement/like', likeResult,
        likeResult.success ? 'Content liked successfully' : '');

    // POST /user/engagement/save - Save content
    const saveResult = await makeRequest('POST', '/user/engagement/save', {
        contentId: testData.contentId,
        type: 'content'
    });
    logTest('POST /user/engagement/save', saveResult,
        saveResult.success ? 'Content saved successfully' : '');

    // POST /user/engagement/watch-progress - Update watch progress
    const watchResult = await makeRequest('POST', '/user/engagement/watch-progress', {
        contentId: testData.contentId,
        progress: 50,
        duration: 100
    });
    logTest('POST /user/engagement/watch-progress', watchResult,
        watchResult.success ? 'Watch progress updated' : '');

    // GET /user/engagement/saved - Get saved content
    const savedResult = await makeRequest('GET', '/user/engagement/saved');
    logTest('GET /user/engagement/saved', savedResult,
        savedResult.success ? `Found ${savedResult.data.data?.length || 0} saved items` : '');

    // GET /user/engagement/history - Get watch history
    const historyResult = await makeRequest('GET', '/user/engagement/history');
    logTest('GET /user/engagement/history', historyResult,
        historyResult.success ? `Found ${historyResult.data.data?.length || 0} history items` : '');
}

// Progress Routes Tests
async function testProgressRoutes() {
    console.log('\n📊 Testing Progress Routes...');

    // POST /user/progress/workout-plan/start - Start workout plan
    const startWorkoutResult = await makeRequest('POST', '/user/progress/workout-plan/start', {
        workoutPlanId: testData.workoutPlanId
    });
    logTest('POST /user/progress/workout-plan/start', startWorkoutResult,
        startWorkoutResult.success ? 'Workout plan started' : '');

    // POST /user/progress/exercise/complete - Complete exercise
    const completeExerciseResult = await makeRequest('POST', '/user/progress/exercise/complete', {
        exerciseId: testData.exerciseId,
        workoutPlanId: testData.workoutPlanId,
        duration: 300,
        reps: 10,
        sets: 3
    });
    logTest('POST /user/progress/exercise/complete', completeExerciseResult,
        completeExerciseResult.success ? 'Exercise completed' : '');

    // POST /user/progress/challenge/join - Join challenge
    const joinChallengeResult = await makeRequest('POST', '/user/progress/challenge/join', {
        challengeId: testData.challengeId
    });
    logTest('POST /user/progress/challenge/join', joinChallengeResult,
        joinChallengeResult.success ? 'Challenge joined' : '');

    // POST /user/progress/challenge/update - Update challenge progress
    const updateChallengeResult = await makeRequest('POST', '/user/progress/challenge/update', {
        challengeId: testData.challengeId,
        day: 1,
        completed: true,
        notes: 'Test progress update'
    });
    logTest('POST /user/progress/challenge/update', updateChallengeResult,
        updateChallengeResult.success ? 'Challenge progress updated' : '');

    // GET /user/progress/my-workout-plans - Get my workout plans
    const myWorkoutsResult = await makeRequest('GET', '/user/progress/my-workout-plans');
    logTest('GET /user/progress/my-workout-plans', myWorkoutsResult,
        myWorkoutsResult.success ? `Found ${myWorkoutsResult.data.data?.length || 0} workout plans` : '');

    // GET /user/progress/my-challenges - Get my challenges
    const myChallengesResult = await makeRequest('GET', '/user/progress/my-challenges');
    logTest('GET /user/progress/my-challenges', myChallengesResult,
        myChallengesResult.success ? `Found ${myChallengesResult.data.data?.length || 0} challenges` : '');

    // GET /user/progress/workout-plan/:id - Get workout plan progress
    const workoutProgressResult = await makeRequest('GET', `/user/progress/workout-plan/${testData.workoutPlanId}`);
    logTest('GET /user/progress/workout-plan/:id', workoutProgressResult,
        workoutProgressResult.success ? 'Workout plan progress retrieved' : '');
}

// Profile Routes Tests
async function testProfileRoutes() {
    console.log('\n👤 Testing Profile Routes...');

    // GET /user/profile - Get user profile
    const profileResult = await makeRequest('GET', '/user/profile');
    logTest('GET /user/profile', profileResult,
        profileResult.success ? `Profile: ${profileResult.data.data?.user?.name || 'N/A'}` : '');

    // PUT /user/profile - Update user profile
    const updateProfileResult = await makeRequest('PUT', '/user/profile', {
        name: 'Test User Updated',
        bio: 'Updated bio for testing',
        location: 'Test Location'
    });
    logTest('PUT /user/profile', updateProfileResult,
        updateProfileResult.success ? 'Profile updated successfully' : '');

    // GET /user/profile/history - Get XP history
    const historyResult = await makeRequest('GET', '/user/profile/history', null, { period: 30 });
    logTest('GET /user/profile/history', historyResult,
        historyResult.success ? `XP history entries: ${historyResult.data.data?.history?.length || 0}` : '');

    // GET /user/profile/stats - Get user stats
    const statsResult = await makeRequest('GET', '/user/profile/stats');
    logTest('GET /user/profile/stats', statsResult,
        statsResult.success ? 'User stats retrieved' : '');

    // GET /user/profile/achievements - Get user achievements
    const achievementsResult = await makeRequest('GET', '/user/profile/achievements');
    logTest('GET /user/profile/achievements', achievementsResult,
        achievementsResult.success ? `Found ${achievementsResult.data.data?.length || 0} achievements` : '');

    // POST /user/profile/add-xp - Add XP (for testing)
    const addXPResult = await makeRequest('POST', '/user/profile/add-xp', {
        amount: 50,
        source: 'test',
        description: 'Testing XP addition'
    });
    logTest('POST /user/profile/add-xp', addXPResult,
        addXPResult.success ? 'XP added successfully' : '');
}

// Error handling tests
async function testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');

    // Test invalid content ID
    const invalidContentResult = await makeRequest('GET', '/user/content/99999');
    logTest('GET /user/content/99999 (invalid ID)', invalidContentResult,
        !invalidContentResult.success ? 'Correctly returned error for invalid ID' : 'Should have failed');

    // Test invalid challenge ID
    const invalidChallengeResult = await makeRequest('GET', '/user/challenges/99999');
    logTest('GET /user/challenges/99999 (invalid ID)', invalidChallengeResult,
        !invalidChallengeResult.success ? 'Correctly returned error for invalid ID' : 'Should have failed');

    // Test unauthorized request (without token)
    const originalToken = authToken;
    authToken = '';
    const unauthorizedResult = await makeRequest('GET', '/user/profile');
    logTest('GET /user/profile (no token)', unauthorizedResult,
        !unauthorizedResult.success ? 'Correctly returned unauthorized error' : 'Should have failed');
    authToken = originalToken;
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting User Routes Test Suite');
    console.log('=====================================');
    console.log(`Testing against: ${BASE_URL}`);
    console.log(`Credentials: ${TEST_CREDENTIALS.phone} / ${TEST_CREDENTIALS.password}`);
    console.log('=====================================\n');

    try {
        // Test authentication first
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
            return;
        }

        // Run all route tests
        await testContentRoutes();
        await testWorkoutPlanRoutes();
        await testChallengeRoutes();
        await testEngagementRoutes();
        await testProgressRoutes();
        await testProfileRoutes();
        await testErrorHandling();

        // Print summary
        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

        if (testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            testResults.details
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error?.message || test.error}`);
                });
        }

        console.log('\n🎉 Test suite completed!');

    } catch (error) {
        console.error('💥 Test suite failed with error:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testResults
};
