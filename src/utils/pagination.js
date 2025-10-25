"use strict"

/**
 * Extract pagination parameters from query string
 * @param {Object} query - Express req.query object
 * @returns {Object} - { page, pageSize, limit, offset }
 */
function getPagination(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20))
    const offset = (page - 1) * pageSize
    const limit = pageSize
    return { page, pageSize, offset, limit }
}

/**
 * Create a paginated response object
 * @param {Array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} pageSize - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} - Paginated response object
 */
function createPaginatedResponse(items, page, pageSize, total) {
    const totalPages = Math.ceil(total / pageSize)

    return {
        items,
        pagination: {
            page,
            pageSize,
            totalItems: total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createPaginatedResponse instead
 */
function toPaged(items, page, pageSize, total) {
    return { items, page, pageSize, total }
}

/**
 * Execute a paginated database query with automatic response formatting
 * @param {Object} model - Sequelize model
 * @param {Object} options - Query options (where, include, order, etc.)
 * @param {Object} pagination - Pagination parameters from getPagination()
 * @returns {Object} - Paginated response object
 */
async function executePaginatedQuery(model, options, pagination) {
    const { page, pageSize, limit, offset } = pagination

    const queryOptions = {
        ...options,
        limit,
        offset
    }

    const { count, rows } = await model.findAndCountAll(queryOptions)

    return createPaginatedResponse(rows, page, pageSize, count)
}

/**
 * Execute a paginated database query with separate count to avoid include counting issues
 * Use this when you have includes that might affect the count
 * @param {Object} model - Sequelize model
 * @param {Object} options - Query options (where, include, order, etc.)
 * @param {Object} pagination - Pagination parameters from getPagination()
 * @returns {Object} - Paginated response object
 */
async function executePaginatedQueryWithSeparateCount(model, options, pagination) {
    const { page, pageSize, limit, offset } = pagination

    // Get count separately to avoid counting included rows
    const countOptions = { ...options }
    delete countOptions.include  // Remove includes from count query
    delete countOptions.order    // Remove order from count query
    delete countOptions.limit    // Remove limit from count query
    delete countOptions.offset   // Remove offset from count query

    const totalCount = await model.count(countOptions)

    // Get the data with includes
    const queryOptions = {
        ...options,
        limit,
        offset
    }

    const rows = await model.findAll(queryOptions)

    return createPaginatedResponse(rows, page, pageSize, totalCount)
}

module.exports = {
    getPagination,
    createPaginatedResponse,
    toPaged, // Keep for backward compatibility
    executePaginatedQuery,
    executePaginatedQueryWithSeparateCount
}



