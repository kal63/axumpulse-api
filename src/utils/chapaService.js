'use strict'

const axios = require('axios')

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY
const CHAPA_BASE_URL = 'https://api.chapa.co/v1'

/**
 * Initialize a payment transaction with Chapa
 * @param {Object} paymentData - Payment initialization data
 * @returns {Promise<Object>} Chapa API response
 */
async function initializePayment(paymentData) {
    try {
        if (!CHAPA_SECRET_KEY) {
            throw new Error('CHAPA_SECRET_KEY is not set in environment variables')
        }

        const response = await axios.post(
            `${CHAPA_BASE_URL}/transaction/initialize`,
            paymentData,
            {
                headers: {
                    'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        return response.data
    } catch (error) {
        console.error('Chapa payment initialization error:', error.response?.data || error.message)
        throw error
    }
}

/**
 * Verify a transaction with Chapa
 * @param {string} txRef - Transaction reference
 * @returns {Promise<Object>} Verification response
 */
async function verifyTransaction(txRef) {
    try {
        if (!CHAPA_SECRET_KEY) {
            throw new Error('CHAPA_SECRET_KEY is not set in environment variables')
        }

        const response = await axios.get(
            `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
            {
                headers: {
                    'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                },
            }
        )
        return response.data
    } catch (error) {
        console.error('Chapa verification error:', error.response?.data || error.message)
        throw error
    }
}

module.exports = {
    initializePayment,
    verifyTransaction,
}

