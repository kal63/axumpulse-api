# Backend Development Rules & Guidelines

This document outlines the coding standards, patterns, and best practices for the AxumPulse API backend. Follow these rules to maintain consistency and avoid common pitfalls.

## 🏗️ **Project Structure**

```
axumpulse-api/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── admin/        # Admin-only routes
│   │   ├── trainer/      # Trainer-only routes
│   │   ├── public/       # Public routes (no auth)
│   │   └── auth.js       # Authentication routes
│   ├── models/           # Sequelize database models
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── db/               # Database configuration
│   └── server.js         # Main server file
├── migrations/           # Database migrations
├── seeders/              # Database seeders
└── logs/                 # Application logs
```

## 🔐 **Authentication & Authorization**

### **Middleware Usage**
- **ALWAYS** use `requireAuth` for protected routes
- **ALWAYS** use `requireAdmin` for admin-only routes
- **ALWAYS** use `requireTrainer` for trainer-only routes
- **NEVER** skip authentication middleware

```javascript
// ✅ CORRECT - Admin route
router.use(requireAuth);
router.use(requireAdmin);

// ✅ CORRECT - Trainer route  
router.use(requireAuth);
router.use(requireTrainer);

// ❌ WRONG - Missing middleware
router.get('/admin/users', async (req, res) => {
    // This will fail - no auth middleware
});
```

### **User Context**
- Access user info via `req.user` (set by `requireAuth`)
- Available fields: `id`, `isAdmin`, `isTrainer`
- **ALWAYS** validate user permissions in route handlers

```javascript
// ✅ CORRECT
const trainerId = req.user?.id;
if (!trainerId) {
    return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401);
}
```

## 📊 **Pagination Rules**

### **MANDATORY: Use Pagination Utilities**
- **ALWAYS** use `getPagination(req.query)` to extract pagination params
- **ALWAYS** use pagination utility functions for database queries
- **NEVER** implement manual pagination logic

### **Pagination Utility Functions**

```javascript
// ✅ CORRECT - For simple queries (no includes)
const result = await executePaginatedQuery(Model, {
    where: whereClause,
    order: [['createdAt', 'DESC']]
}, pagination);

// ✅ CORRECT - For queries with includes (prevents count issues)
const result = await executePaginatedQueryWithSeparateCount(Model, {
    where: whereClause,
    include: [{ model: RelatedModel, as: 'relation' }],
    order: [['createdAt', 'DESC']]
}, pagination);
```

### **When to Use Which Function**
- **`executePaginatedQuery`**: Use for simple queries without `include`
- **`executePaginatedQueryWithSeparateCount`**: Use for queries with `include` (prevents counting related records)

### **Pagination Response Format**
```javascript
{
    items: [...],           // Array of data
    pagination: {
        page: 1,            // Current page
        pageSize: 20,       // Items per page
        totalItems: 100,    // Total count
        totalPages: 5,      // Total pages
        hasNext: true,      // Has next page
        hasPrev: false      // Has previous page
    }
}
```

## 🗄️ **Database & Models**

### **Model Definition Standards**
- **ALWAYS** use `'use strict'` at the top
- **ALWAYS** define proper indexes for performance
- **ALWAYS** use `tableName` to specify exact table name
- **ALWAYS** define associations in `associate` function

```javascript
// ✅ CORRECT Model Structure
'use strict'

module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('Model', {
        // Fields with proper types and constraints
        fieldName: { 
            type: DataTypes.STRING(100), 
            allowNull: false,
            validate: { /* validations */ }
        }
    }, {
        tableName: 'table_name',
        underscored: false,
        indexes: [
            { fields: ['fieldName'], name: 'field_name_idx' }
        ]
    });

    Model.associate = (models) => {
        Model.belongsTo(models.OtherModel, { foreignKey: 'otherId' });
    };

    return Model;
};
```

### **Query Patterns**
- **ALWAYS** use proper error handling with try-catch
- **ALWAYS** validate input parameters
- **ALWAYS** use parameterized queries (Sequelize handles this)
- **NEVER** use raw SQL unless absolutely necessary

```javascript
// ✅ CORRECT Query Pattern
router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;
        const pagination = getPagination(req.query);
        
        const where = { trainerId: req.user.id };
        if (status) where.status = status;
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } }
            ];
        }

        const result = await executePaginatedQuery(Model, {
            where,
            order: [['createdAt', 'DESC']]
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});
```

## 📝 **Error Handling**

### **MANDATORY: Use Error Utilities**
- **ALWAYS** use `ok(res, data)` for successful responses
- **ALWAYS** use `err(res, error, status)` for error responses
- **NEVER** use `res.json()` or `res.status().json()` directly

```javascript
// ✅ CORRECT
ok(res, { message: 'Success', data: result });
err(res, { code: 'NOT_FOUND', message: 'Resource not found' }, 404);

// ❌ WRONG
res.json({ success: true, data: result });
res.status(404).json({ error: 'Not found' });
```

### **Error Response Format**
```javascript
// Success Response
{
    success: true,
    data: { /* response data */ }
}

// Error Response  
{
    success: false,
    error: {
        code: 'ERROR_CODE',
        message: 'Human readable message',
        details: { /* additional error details */ }
    }
}
```

### **Common Error Codes**
- `BAD_REQUEST` - Invalid input (400)
- `UNAUTHORIZED` - Missing/invalid auth (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `VALIDATION_ERROR` - Data validation failed (400)
- `SERVER_ERROR` - Internal server error (500)

### **Password Management**
- **NEVER** implement password change functionality in trainer settings
- Password management is handled by a separate authentication service
- Only include password-related fields for display purposes (read-only)

### **File Upload Configuration**
- **ALWAYS** set Express body parser limits: `express.json({ limit: '100mb' })`
- **Profile images**: Use `fileSize: 10 * 1024 * 1024` (10MB) - reasonable for profile pics
- **Content uploads**: Use `fileSize: 100 * 1024 * 1024` (100MB) - for videos and large files
- **ALWAYS** validate file types and sizes on both frontend and backend
- **ALWAYS** use proper error handling for file upload failures

### **File Upload Frontend Pattern**
- **NEVER** use API client for file uploads (FormData conflicts with JSON.stringify)
- **ALWAYS** use direct fetch with FormData for file uploads
- **ALWAYS** include Authorization header with Bearer token
- **ALWAYS** handle multipart/form-data properly

## 🛣️ **Route Organization**

### **Route Structure**
- **ALWAYS** organize routes by user role: `admin/`, `trainer/`, `public/`
- **ALWAYS** use descriptive route names
- **ALWAYS** group related routes in the same file
- **ALWAYS** use RESTful conventions

```javascript
// ✅ CORRECT Route Structure
// GET    /api/v1/admin/users           - List users
// POST   /api/v1/admin/users           - Create user  
// GET    /api/v1/admin/users/:id       - Get user
// PUT    /api/v1/admin/users/:id       - Update user
// DELETE /api/v1/admin/users/:id       - Delete user
```

### **Route File Template**
```javascript
'use strict'

const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');
const { Model } = require('../../models');
const { Op } = require('sequelize');

// Apply middleware
router.use(requireAuth);
router.use(requireAdmin); // or requireTrainer

// GET /api/v1/admin/models
router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        // ... implementation
        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;
```

## 🔍 **Search & Filtering**

### **Search Implementation**
- **ALWAYS** use `Op.like` for text search
- **ALWAYS** use `Op.or` for multiple search fields
- **ALWAYS** sanitize search input
- **ALWAYS** add database indexes for searchable fields

```javascript
// ✅ CORRECT Search Pattern
if (search) {
    where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
    ];
}
```

### **Filter Implementation**
- **ALWAYS** validate filter values
- **ALWAYS** use proper data types for filters
- **ALWAYS** handle undefined/null filter values

```javascript
// ✅ CORRECT Filter Pattern
const where = { trainerId: req.user.id };
if (status && status !== 'all') {
    where.status = status;
}
if (difficulty && difficulty !== 'all') {
    where.difficulty = difficulty;
}
```

## 📁 **File Uploads**

### **Upload Handling**
- **ALWAYS** validate file types and sizes
- **ALWAYS** use secure file naming
- **ALWAYS** store files in `/uploads` directory
- **ALWAYS** serve files via `/api/v1/uploads` endpoint

```javascript
// ✅ CORRECT Upload Pattern
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'), false);
        }
    }
});
```

## 🧪 **Testing & Validation**

### **Input Validation**
- **ALWAYS** validate required fields
- **ALWAYS** validate data types
- **ALWAYS** validate business rules
- **ALWAYS** return meaningful error messages

```javascript
// ✅ CORRECT Validation Pattern
const { title, description } = req.body;
if (!title || !description) {
    return err(res, { 
        code: 'BAD_REQUEST', 
        message: 'Title and description are required' 
    }, 400);
}
```

### **Database Validation**
- **ALWAYS** use Sequelize model validations
- **ALWAYS** handle unique constraint errors
- **ALWAYS** handle foreign key constraint errors

## 📋 **Logging & Monitoring**

### **Action Logging**
- **ALWAYS** use `actionLogger` middleware for admin actions
- **ALWAYS** log important user actions
- **ALWAYS** include user context in logs

```javascript
// ✅ CORRECT Logging Pattern
router.post('/:id/verify', 
    actionLogger('trainer_verify', { trainerId: 'params.id' }),
    async (req, res) => {
        // ... implementation
    }
);
```

## 🚫 **Common Mistakes to Avoid**

### **❌ DON'T DO THESE:**

1. **Manual Pagination**
```javascript
// ❌ WRONG - Manual pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;
```

2. **Direct Response Objects**
```javascript
// ❌ WRONG - Direct response
res.json({ success: true, data: result });
```

3. **Missing Error Handling**
```javascript
// ❌ WRONG - No error handling
router.get('/', async (req, res) => {
    const data = await Model.findAll();
    ok(res, data);
});
```

4. **Incorrect Include Counting**
```javascript
// ❌ WRONG - Will count related records
const result = await executePaginatedQuery(Model, {
    include: [{ model: RelatedModel }]
}, pagination);
```

5. **Missing Authentication**
```javascript
// ❌ WRONG - No auth middleware
router.get('/admin/users', async (req, res) => {
    // Anyone can access this!
});
```

## ✅ **Best Practices Summary**

1. **Use utility functions** for pagination, errors, and common operations
2. **Apply proper middleware** for authentication and authorization
3. **Handle errors consistently** with try-catch and error utilities
4. **Validate all inputs** before processing
5. **Use proper database patterns** with Sequelize
6. **Follow RESTful conventions** for API design
7. **Log important actions** for audit trails
8. **Test thoroughly** before deployment

## 🔧 **Quick Reference**

### **Required Imports for Routes**
```javascript
const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');
const { requireAuth, requireAdmin, requireTrainer } = require('../../middleware');
const { actionLogger } = require('../../middleware/actionLogger');
```

### **Standard Route Template**
```javascript
'use strict'

const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');
const { Model } = require('../../models');
const { Op } = require('sequelize');

// Apply middleware
router.use(requireAuth);
router.use(requireAdmin); // or requireTrainer

router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const result = await executePaginatedQuery(Model, {
            where: { /* conditions */ },
            order: [['createdAt', 'DESC']]
        }, pagination);
        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;
```

---

**Remember**: Consistency is key! Follow these patterns to maintain a clean, maintainable, and scalable codebase.
