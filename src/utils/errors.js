function ok(res, data, status = 200) {
    res.status(status).json({ success: true, data });
}

function err(res, error, status = 500) {
    console.error('API Error:', error); // Log the full error for debugging

    let errorCode = 'SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details = {};

    if (error.code) {
        errorCode = error.code;
    } else if (error.name === 'SequelizeUniqueConstraintError') {
        errorCode = 'VALIDATION_ERROR';
        message = 'A record with this unique field already exists.';
        details = error.errors.map(e => ({ field: e.path, message: e.message }));
        status = 409; // Conflict
    } else if (error.name === 'SequelizeValidationError') {
        errorCode = 'VALIDATION_ERROR';
        message = 'Validation failed.';
        details = error.errors.map(e => ({ field: e.path, message: e.message }));
        status = 400; // Bad Request
    } else if (error.message) {
        message = error.message;
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



