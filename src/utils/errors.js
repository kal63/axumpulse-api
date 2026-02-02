function ok(res, data, statusOrMessage = 200) {
    let status = 200;
    let message = null;
    
    // If third parameter is a number, it's a status code
    // If it's a string, it's a message (use default status 200)
    if (typeof statusOrMessage === 'number') {
        status = statusOrMessage;
    } else if (typeof statusOrMessage === 'string') {
        message = statusOrMessage;
    }
    
    const response = { success: true, data };
    if (message) {
        response.message = message;
    }
    
    res.status(status).json(response);
}

function err(res, error, status = 500) {
    console.error('API Error:', error); // Log the full error for debugging

    let errorCode = 'SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details = {};

    // Handle error object with code and message properties
    if (error && typeof error === 'object') {
        if (error.code) {
            errorCode = error.code;
        }
        if (error.message) {
            message = error.message;
        }
        if (error.details) {
            details = error.details;
        }
    }
    
    // Handle Sequelize-specific errors
    if (error && error.name === 'SequelizeUniqueConstraintError') {
        errorCode = 'VALIDATION_ERROR';
        message = error.message || 'A record with this unique field already exists.';
        details = error.errors ? error.errors.map(e => ({ field: e.path, message: e.message })) : {};
        status = 409; // Conflict
    } else if (error && error.name === 'SequelizeValidationError') {
        errorCode = 'VALIDATION_ERROR';
        message = error.message || 'Validation failed.';
        details = error.errors ? error.errors.map(e => ({ field: e.path, message: e.message })) : {};
        status = 400; // Bad Request
    }

    res.status(status).json({
        success: false,
        error: {
            code: errorCode,
            message,
            details
        }
    });
}

module.exports = { ok, err };



