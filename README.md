# AxumPulse API

A comprehensive fitness application backend API built with Node.js, Express, and MySQL. This API powers the AxumPulse fitness platform, providing endpoints for user management, workout plans, challenges, content management, and trainer applications.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Workout Plans**: CRUD operations for workout plans and exercises
- **Challenges**: Fitness challenges and progress tracking
- **Content Management**: Video content, trainer profiles, and interactions
- **Trainer System**: Trainer applications and content creation
- **Admin Panel**: User management, content moderation, and analytics
- **File Uploads**: Profile pictures, content images, and documents

### Authentication & Security
- JWT-based authentication
- Role-based access control (User, Trainer, Admin)
- Password hashing with bcrypt
- File upload validation and security

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd axumpulse-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=axumpulse_db
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./src/uploads
   ```

4. **Database Setup**
   ```bash
   # Create the database
   mysql -u root -p
   CREATE DATABASE axumpulse_db;
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
axumpulse-api/
├── src/
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── uploads/         # File uploads directory
│   └── utils/           # Utility functions
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `POST /user/profile/profile-image` - Upload profile picture
- `DELETE /user/profile/profile-image` - Remove profile picture

### Settings
- `GET /user/settings` - Get all user settings
- `PUT /user/settings` - Update all settings
- `GET /user/settings/account` - Get account settings
- `PUT /user/settings/account` - Update account settings
- `GET /user/settings/preferences` - Get preferences
- `PUT /user/settings/preferences` - Update preferences
- `GET /user/settings/notifications` - Get notification settings
- `PUT /user/settings/notifications` - Update notification settings
- `GET /user/settings/fitness` - Get fitness settings
- `PUT /user/settings/fitness` - Update fitness settings

### Workout Plans
- `GET /user/workout-plans` - Get all workout plans
- `GET /user/workout-plans/:id` - Get specific workout plan
- `POST /user/workout-plans/:id/start` - Start workout plan
- `POST /user/workout-plans/:id/complete` - Complete workout plan

### Challenges
- `GET /user/challenges` - Get all challenges
- `GET /user/challenges/:id` - Get specific challenge
- `POST /user/challenges/:id/join` - Join challenge
- `POST /user/challenges/:id/complete` - Complete challenge

### Content & Videos
- `GET /user/videos` - Get all videos
- `GET /user/videos/:id` - Get specific video
- `POST /user/videos/:id/like` - Like video
- `POST /user/videos/:id/view` - Record video view

### Trainer Applications
- `GET /user/apply` - Get application status
- `POST /user/apply` - Submit trainer application
- `PUT /user/apply` - Update application

### Admin Routes
- `GET /admin/users` - Get all users
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/trainers` - Get all trainers
- `PUT /admin/trainers/:id/approve` - Approve trainer
- `PUT /admin/trainers/:id/reject` - Reject trainer

### Public Routes
- `GET /public/languages` - Get available languages
- `GET /public/categories` - Get content categories

## 🗄️ Database Models

### Core Models
- **User**: User accounts and profiles
- **Trainer**: Trainer profiles and applications
- **WorkoutPlan**: Workout plans and exercises
- **Challenge**: Fitness challenges
- **Content**: Video content and metadata
- **UserContentProgress**: User progress tracking
- **ContentInteraction**: User interactions (likes, views)

### Relationships
- Users can have multiple workout plans
- Users can join multiple challenges
- Trainers can create multiple content pieces
- Users can interact with multiple content pieces

## 🔧 Configuration

### Database Configuration
The database configuration is managed through `src/config/config.json` and environment variables.

### File Upload Configuration
- **Max file size**: 5MB (configurable)
- **Allowed file types**: Images (jpg, jpeg, png, gif)
- **Upload directory**: `src/uploads/`

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- File upload validation
- SQL injection prevention
- CORS configuration

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/server.js --name axumpulse-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=axumpulse_production
JWT_SECRET=your_production_jwt_secret
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

For detailed API documentation, please refer to the individual route files in the `src/routes/` directory. Each route file contains comprehensive documentation for its endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added trainer application system
- **v1.2.0** - Enhanced user settings and profile management
- **v1.3.0** - Added file upload functionality and improved security

---

**Built with ❤️ for the AxumPulse fitness community**
