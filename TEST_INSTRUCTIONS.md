# 🧪 User Routes Testing Guide

## Overview
This guide explains how to test all the user routes we created in the `/user` API folder.

## Prerequisites

1. **Backend server running**:
   ```bash
   cd axumpulse-api
   npm start
   # Server should be running on http://localhost:5000
   ```

2. **Database with test data**:
   - Make sure migrations are run: `npx sequelize-cli db:migrate`
   - Make sure seeders are run: `npx sequelize-cli db:seed:all`
   - Verify test user exists: `+251934567890` / `user123`

3. **Test data available**:
   - At least 1 content item (ID: 1)
   - At least 1 workout plan (ID: 1)
   - At least 1 challenge (ID: 1)
   - At least 1 exercise (ID: 1)

## Test Files

### 1. Quick Test (`quick-test.js`)
**Purpose**: Fast verification that all endpoints are accessible

**Usage**:
```bash
cd axumpulse-api
node quick-test.js
```

**What it tests**:
- ✅ Authentication (login)
- ✅ All GET endpoints (18 routes)
- ✅ Key POST endpoints (5 routes)
- ✅ Basic error handling

**Output**: Simple pass/fail for each endpoint

---

### 2. Comprehensive Test (`test-user-routes.js`)
**Purpose**: Detailed testing with full error reporting and data validation

**Usage**:
```bash
cd axumpulse-api
node test-user-routes.js
```

**What it tests**:
- ✅ Authentication with token validation
- ✅ All user routes (35+ endpoints)
- ✅ Request/response data validation
- ✅ Error handling scenarios
- ✅ Edge cases and invalid inputs
- ✅ Detailed logging and reporting

**Output**: Comprehensive test report with success rates and error details

---

## Test Coverage

### Content Routes (`/user/content`)
- ✅ `GET /user/content` - List content with pagination
- ✅ `GET /user/content/categories` - Get content categories
- ✅ `GET /user/content/:id` - Get content detail

### Workout Plan Routes (`/user/workout-plans`)
- ✅ `GET /user/workout-plans` - List workout plans
- ✅ `GET /user/workout-plans/categories` - Get categories
- ✅ `GET /user/workout-plans/:id` - Get workout plan detail

### Challenge Routes (`/user/challenges`)
- ✅ `GET /user/challenges` - List challenges
- ✅ `GET /user/challenges/categories` - Get categories
- ✅ `GET /user/challenges/:id` - Get challenge detail
- ✅ `GET /user/challenges/:id/leaderboard` - Get leaderboard

### Engagement Routes (`/user/engagement`)
- ✅ `POST /user/engagement/like` - Like content
- ✅ `POST /user/engagement/save` - Save content
- ✅ `POST /user/engagement/watch-progress` - Update watch progress
- ✅ `GET /user/engagement/saved` - Get saved content
- ✅ `GET /user/engagement/history` - Get watch history

### Progress Routes (`/user/progress`)
- ✅ `POST /user/progress/workout-plan/start` - Start workout plan
- ✅ `POST /user/progress/exercise/complete` - Complete exercise
- ✅ `POST /user/progress/challenge/join` - Join challenge
- ✅ `POST /user/progress/challenge/update` - Update challenge progress
- ✅ `GET /user/progress/my-workout-plans` - Get my workout plans
- ✅ `GET /user/progress/my-challenges` - Get my challenges
- ✅ `GET /user/progress/workout-plan/:id` - Get workout plan progress

### Profile Routes (`/user/profile`)
- ✅ `GET /user/profile` - Get user profile
- ✅ `PUT /user/profile` - Update user profile
- ✅ `GET /user/profile/history` - Get XP history
- ✅ `GET /user/profile/stats` - Get user stats
- ✅ `GET /user/profile/achievements` - Get user achievements
- ✅ `POST /user/profile/add-xp` - Add XP (for testing)

---

## Expected Results

### Successful Test Run
```
🚀 Quick User Routes Test

1. Testing login...
✅ Login successful

✅ Content List - Status: 200
✅ Content Categories - Status: 200
✅ Content Detail - Status: 200
✅ Workout Plans - Status: 200
✅ Workout Categories - Status: 200
✅ Workout Detail - Status: 200
✅ Challenges - Status: 200
✅ Challenge Categories - Status: 200
✅ Challenge Detail - Status: 200
✅ Challenge Leaderboard - Status: 200
✅ Saved Content - Status: 200
✅ Watch History - Status: 200
✅ My Workout Plans - Status: 200
✅ My Challenges - Status: 200
✅ User Profile - Status: 200
✅ User Stats - Status: 200
✅ User Achievements - Status: 200
✅ XP History - Status: 200

📝 Testing POST endpoints...
✅ Like Content - Status: 200
✅ Save Content - Status: 200
✅ Watch Progress - Status: 200
✅ Join Challenge - Status: 200
✅ Start Workout Plan - Status: 200

📊 Results:
✅ Passed: 23
❌ Failed: 0
Success Rate: 100.0%
```

### Common Issues and Solutions

#### 1. Authentication Failed
```
❌ Login - Error: 401
```
**Solution**: 
- Check if user exists in database
- Verify password is correct
- Check if user is active

#### 2. Content Not Found
```
❌ Content Detail - Error: 404
```
**Solution**:
- Run seeders to create test data
- Check if content with ID 1 exists
- Verify content status is 'approved'

#### 3. Database Connection Error
```
❌ Content List - Error: ECONNREFUSED
```
**Solution**:
- Start MySQL server
- Check database connection in `.env`
- Verify database exists

#### 4. Server Not Running
```
❌ Content List - Error: ECONNREFUSED
```
**Solution**:
- Start the backend server: `npm start`
- Check if server is running on port 5000
- Verify no port conflicts

---

## Manual Testing

### Using Postman/Insomnia

1. **Import the collection** (if available)
2. **Set base URL**: `http://localhost:5000/api/v1`
3. **Login first**: `POST /auth/login`
4. **Copy the token** from response
5. **Set Authorization header**: `Bearer <token>`
6. **Test each endpoint** in the collection

### Using curl

```bash
# 1. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+251934567890","password":"user123"}'

# 2. Use token for authenticated requests
curl -X GET http://localhost:5000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test Data Requirements

### Minimum Required Data
```sql
-- Users table should have:
INSERT INTO Users (id, phone, password, role, isActive) VALUES 
(1, '+251934567890', '$2b$10$...', 'user', true);

-- Content table should have:
INSERT INTO Contents (id, title, type, status, trainerId) VALUES 
(1, 'Test Video', 'video', 'approved', 1);

-- WorkoutPlans table should have:
INSERT INTO WorkoutPlans (id, title, status, trainerId) VALUES 
(1, 'Test Workout', 'approved', 1);

-- Challenges table should have:
INSERT INTO Challenges (id, title, status, trainerId) VALUES 
(1, 'Test Challenge', 'approved', 1);

-- Exercises table should have:
INSERT INTO Exercises (id, name, workoutPlanId) VALUES 
(1, 'Test Exercise', 1);
```

---

## Troubleshooting

### Check Server Status
```bash
# Check if server is running
curl http://localhost:5000/api/v1/health

# Check server logs
tail -f logs/app.log
```

### Check Database
```bash
# Connect to MySQL
mysql -u root -p

# Check tables
USE axumpulse;
SHOW TABLES;

# Check user exists
SELECT * FROM Users WHERE phone = '+251934567890';
```

### Check Environment
```bash
# Verify .env file
cat .env

# Check if all required variables are set
echo $DB_HOST
echo $DB_NAME
echo $JWT_SECRET
```

---

## Performance Testing

### Load Testing (Optional)
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:5000/api/v1/user/content
```

### Memory Usage
```bash
# Monitor memory usage
node --inspect test-user-routes.js

# Open Chrome DevTools
# Navigate to chrome://inspect
```

---

## Next Steps

After successful testing:

1. **Frontend Integration**: Test with actual frontend
2. **Error Handling**: Verify error responses are user-friendly
3. **Performance**: Check response times
4. **Security**: Test with invalid tokens, SQL injection attempts
5. **Edge Cases**: Test with large datasets, concurrent requests

---

**Happy Testing!** 🧪✨



