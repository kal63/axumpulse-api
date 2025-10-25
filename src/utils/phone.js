/**
 * Ethiopian Phone Number Utilities
 * 
 * Ethiopian phone numbers follow the format: +251XXXXXXXXX
 * - Country code: +251
 * - Mobile numbers start with 9 (e.g., +2519XXXXXXXX)
 * - Landline numbers start with 1 (e.g., +2511XXXXXXXX)
 */

/**
 * Validates if a phone number is a valid Ethiopian phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEthiopianPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    // Remove any spaces, dashes, or parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Ethiopian phone number regex
    // +251 followed by 9 digits (mobile) or 1 followed by 8 digits (landline)
    const ethiopianPhoneRegex = /^\+251(9\d{8}|1\d{8})$/;

    return ethiopianPhoneRegex.test(cleaned);
}

/**
 * Formats a phone number to Ethiopian format
 * @param {string} phone - The phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatEthiopianPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return null;
    }

    // Remove any spaces, dashes, parentheses, or other characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If it already starts with +251, validate and return
    if (cleaned.startsWith('+251')) {
        return isValidEthiopianPhone(cleaned) ? cleaned : null;
    }

    // If it starts with 251, add the + sign
    if (cleaned.startsWith('251')) {
        const withPlus = '+' + cleaned;
        return isValidEthiopianPhone(withPlus) ? withPlus : null;
    }

    // If it starts with 0, replace with +251
    if (cleaned.startsWith('0')) {
        const withoutZero = cleaned.substring(1);
        const withCountryCode = '+251' + withoutZero;
        return isValidEthiopianPhone(withCountryCode) ? withCountryCode : null;
    }

    // If it's just 9 digits, assume it's a mobile number
    if (/^9\d{8}$/.test(cleaned)) {
        return '+251' + cleaned;
    }

    // If it's 1 followed by 8 digits, assume it's a landline
    if (/^1\d{8}$/.test(cleaned)) {
        return '+251' + cleaned;
    }

    return null;
}

/**
 * Normalizes a phone number for database storage
 * @param {string} phone - The phone number to normalize
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizeEthiopianPhone(phone) {
    return formatEthiopianPhone(phone);
}

/**
 * Generates sample Ethiopian phone numbers for testing
 * @param {number} count - Number of phone numbers to generate
 * @param {string} type - 'mobile' or 'landline'
 * @returns {string[]} - Array of sample phone numbers
 */
function generateSampleEthiopianPhones(count = 5, type = 'mobile') {
    const phones = [];

    for (let i = 0; i < count; i++) {
        if (type === 'mobile') {
            // Generate mobile number: +2519XXXXXXXX
            const mobileNumber = '9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            phones.push('+251' + mobileNumber);
        } else {
            // Generate landline number: +2511XXXXXXXX
            const landlineNumber = '1' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            phones.push('+251' + landlineNumber);
        }
    }

    return phones;
}

/**
 * Extracts the local number part from a full Ethiopian phone number
 * @param {string} phone - The full phone number
 * @returns {string|null} - The local number part or null if invalid
 */
function getLocalNumber(phone) {
    if (!isValidEthiopianPhone(phone)) {
        return null;
    }

    return phone.substring(4); // Remove +251
}

/**
 * Masks a phone number for display (shows only last 4 digits)
 * @param {string} phone - The phone number to mask
 * @returns {string} - Masked phone number
 */
function maskEthiopianPhone(phone) {
    if (!isValidEthiopianPhone(phone)) {
        return phone;
    }

    const localNumber = getLocalNumber(phone);
    const masked = localNumber.substring(0, localNumber.length - 4) + '****';
    return '+251' + masked;
}

module.exports = {
    isValidEthiopianPhone,
    formatEthiopianPhone,
    normalizeEthiopianPhone,
    generateSampleEthiopianPhones,
    getLocalNumber,
    maskEthiopianPhone
};
