require('dotenv').config();
const {
    isValidEthiopianPhone,
    formatEthiopianPhone,
    normalizeEthiopianPhone,
    generateSampleEthiopianPhones,
    getLocalNumber,
    maskEthiopianPhone
} = require('./src/utils/phone');

console.log('🧪 Testing Ethiopian Phone Number Utilities...\n');

// Test 1: Valid phone numbers
console.log('1. Testing valid phone numbers:');
const validPhones = [
    '+251911234567',  // Mobile
    '+251123456789',  // Landline
    '251911234567',   // Without +
    '0911234567',     // With 0 prefix
    '911234567'       // Just mobile number
];

validPhones.forEach(phone => {
    const isValid = isValidEthiopianPhone(phone);
    const formatted = formatEthiopianPhone(phone);
    const normalized = normalizeEthiopianPhone(phone);
    console.log(`   ${phone} -> Valid: ${isValid}, Formatted: ${formatted}, Normalized: ${normalized}`);
});

// Test 2: Invalid phone numbers
console.log('\n2. Testing invalid phone numbers:');
const invalidPhones = [
    '+1234567890',    // US number
    '+251812345678',  // Invalid prefix
    '+25191123456',   // Too short
    '+2519112345678', // Too long
    'invalid',        // Not a number
    ''                // Empty
];

invalidPhones.forEach(phone => {
    const isValid = isValidEthiopianPhone(phone);
    const formatted = formatEthiopianPhone(phone);
    console.log(`   ${phone} -> Valid: ${isValid}, Formatted: ${formatted}`);
});

// Test 3: Generate sample phones
console.log('\n3. Generating sample Ethiopian phone numbers:');
const sampleMobile = generateSampleEthiopianPhones(3, 'mobile');
const sampleLandline = generateSampleEthiopianPhones(2, 'landline');
console.log('   Mobile:', sampleMobile);
console.log('   Landline:', sampleLandline);

// Test 4: Local number extraction
console.log('\n4. Testing local number extraction:');
const testPhone = '+251911234567';
const localNumber = getLocalNumber(testPhone);
console.log(`   ${testPhone} -> Local: ${localNumber}`);

// Test 5: Phone masking
console.log('\n5. Testing phone masking:');
const maskedPhone = maskEthiopianPhone(testPhone);
console.log(`   ${testPhone} -> Masked: ${maskedPhone}`);

console.log('\n✅ Phone utility tests completed!');
