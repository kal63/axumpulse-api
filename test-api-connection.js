#!/usr/bin/env node

/**
 * API Connection Test Script
 * 
 * This script tests the connection to the AxumPulse API and verifies
 * that the content generation endpoints are working properly.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

class APITester {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Test basic API connectivity
     */
    async testConnection() {
        try {
            console.log(`🔍 Testing connection to: ${this.baseUrl}`);

            // Try to reach the health endpoint
            const response = await axios.get(`http://localhost:4000/healthz`, { timeout: 5000 });
            console.log(`✅ API is reachable (Status: ${response.status})`);
            return true;
        } catch (error) {
            console.error(`❌ API connection failed:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error('💡 Make sure the API server is running on the correct port');
            }
            return false;
        }
    }

    /**
     * Test authentication endpoint
     */
    async testAuthEndpoint() {
        try {
            console.log(`🔐 Testing authentication endpoint...`);

            // Test with invalid credentials to check if endpoint exists
            const response = await axios.post(`${this.baseUrl}/auth/login`, {
                phone: '+251000000000',
                password: 'invalid'
            });

            // If we get a response (even with error), the endpoint exists
            console.log(`✅ Authentication endpoint is working (Status: ${response.status})`);
            return true;
        } catch (error) {
            // Accept any response (including errors) as long as we get a response
            if (error.response) {
                console.log(`✅ Authentication endpoint is working (Got response: ${error.response.status})`);
                return true;
            } else {
                console.error(`❌ Authentication endpoint test failed:`, error.message);
                return false;
            }
        }
    }

    /**
     * Test content endpoints (requires authentication)
     */
    async testContentEndpoints() {
        try {
            console.log(`📝 Testing content endpoints...`);

            // Test GET endpoint (should return 401 without auth)
            const response = await axios.get(`${this.baseUrl}/trainer/content`);

            console.log(`❌ Content endpoint should require authentication`);
            return false;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ Content endpoints are protected (Expected 401 without auth)`);
                return true;
            } else {
                console.error(`❌ Content endpoint test failed:`, error.message);
                return false;
            }
        }
    }

    /**
     * Test upload endpoints (requires authentication)
     */
    async testUploadEndpoints() {
        try {
            console.log(`📤 Testing upload endpoints...`);

            // Test upload endpoint (should return 401 without auth)
            const response = await axios.post(`${this.baseUrl}/trainer/upload/content`);

            console.log(`❌ Upload endpoint should require authentication`);
            return false;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ Upload endpoints are protected (Expected 401 without auth)`);
                return true;
            } else {
                console.error(`❌ Upload endpoint test failed:`, error.message);
                return false;
            }
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 AxumPulse API Connection Test');
        console.log('=================================');

        const tests = [
            { name: 'Basic Connection', test: () => this.testConnection() },
            { name: 'Authentication Endpoint', test: () => this.testAuthEndpoint() },
            { name: 'Content Endpoints', test: () => this.testContentEndpoints() },
            { name: 'Upload Endpoints', test: () => this.testUploadEndpoints() }
        ];

        let passed = 0;
        let failed = 0;

        for (const { name, test } of tests) {
            console.log(`\n🔍 Testing: ${name}`);
            try {
                const result = await test();
                if (result) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(`❌ Test failed with error:`, error.message);
                failed++;
            }
        }

        console.log('\n📊 Test Results');
        console.log('================');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! API is ready for content generation.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the API configuration.');
        }

        return failed === 0;
    }
}

// Main execution
async function main() {
    const tester = new APITester();

    try {
        const success = await tester.runAllTests();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = APITester;
