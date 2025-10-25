# Content Generation Script Guide

This guide explains how to use the content generation script to automatically create workout content using the available video files.

## Prerequisites

1. **Backend API Running**: Make sure your AxumPulse API is running on the configured port (default: http://localhost:4000)
2. **Trainer Accounts**: You need at least one trainer account in your database
3. **Video Files**: The script expects workout videos in `/Users/isaacnegatu/Documents/Random/WorkoutVids`

## Setup

### 1. Configure Trainer Credentials

Edit the `trainer-credentials.js` file and add your trainer credentials:

```javascript
module.exports = [
    { phone: '+251911234567', password: 'trainer123' },
    { phone: '+251922345678', password: 'trainer456' },
    // Add more trainers as needed
];
```

### 2. Verify API Configuration

The script uses these default settings:
- **API URL**: `http://localhost:4000/api/v1` (set via `API_URL` environment variable)
- **Source Videos**: `/Users/isaacnegatu/Documents/Random/WorkoutVids`
- **Upload Directory**: `src/uploads`

## Usage

### Basic Usage

```bash
# Run the content generation script
node generate-content.js
```

### Environment Variables

```bash
# Set custom API URL
API_URL=http://localhost:3001 node generate-content.js

# Set custom port
API_URL=http://localhost:8080 node generate-content.js
```

## What the Script Does

1. **Authentication**: Logs in as each trainer using provided credentials
2. **Video Processing**: 
   - Copies videos from source directory to uploads folder
   - Uploads videos to the API
3. **Content Creation**:
   - Generates random titles, descriptions, and metadata
   - Creates content entries in the database
   - Submits content for admin approval
4. **Reporting**: Provides detailed summary of successful and failed operations

## Content Randomization

The script randomly generates:

- **Titles**: 15 different workout titles
- **Descriptions**: 15 different workout descriptions  
- **Difficulty**: beginner, intermediate, advanced
- **Categories**: cardio, strength, yoga, nutrition, wellness
- **Tags**: Various fitness-related tags
- **Videos**: Randomly selects from available video files

## Video Metadata

The script includes estimated durations and categories for each video:

| Video File | Duration | Category |
|------------|----------|----------|
| 2376809-hd_1920_1080_24fps.mp4 | 180s | cardio |
| 2786540-uhd_3840_2160_25fps.mp4 | 240s | strength |
| 3195395-uhd_3840_2160_25fps.mp4 | 300s | yoga |
| ... | ... | ... |

## Output

The script provides detailed console output:

```
🎬 AxumPulse Content Generator
==============================

🔐 Logging in trainer: +251911234567
✅ Successfully logged in trainer: +251911234567
📹 Selected 3 videos for upload

📹 Processing video: 2376809-hd_1920_1080_24fps.mp4
📁 Copied 2376809-hd_1920_1080_24fps.mp4 to uploads directory
📤 Uploading video: 2376809-hd_1920_1080_24fps.mp4
✅ Successfully uploaded: 2376809-hd_1920_1080_24fps.mp4 -> /uploads/1234567890-123456789.mp4
📝 Creating content: High-Intensity Cardio Blast
✅ Content created with ID: 1
📋 Submitting content for approval: 1
✅ Content submitted for approval: 1
✅ Successfully processed: 2376809-hd_1920_1080_24fps.mp4 -> High-Intensity Cardio Blast

📊 CONTENT GENERATION SUMMARY
================================

👤 Trainer: +251911234567
✅ 2376809-hd_1920_1080_24fps.mp4 -> High-Intensity Cardio Blast (ID: 1)
✅ 2786540-uhd_3840_2160_25fps.mp4 -> Strength Training Fundamentals (ID: 2)
✅ 3195395-uhd_3840_2160_25fps.mp4 -> Yoga Flow for Beginners (ID: 3)

📈 Total: 3 successful, 0 failed
```

## Troubleshooting

### Common Issues

1. **Login Failed**: 
   - Verify trainer credentials are correct
   - Ensure trainer accounts exist in database
   - Check that `isTrainer` flag is set to `true`

2. **Video Upload Failed**:
   - Check if source video directory exists
   - Verify video files are accessible
   - Ensure uploads directory is writable

3. **Content Creation Failed**:
   - Verify API is running and accessible
   - Check database connection
   - Review API logs for detailed error messages

### Debug Mode

For detailed debugging, you can modify the script to add more logging or run with Node.js debug flags:

```bash
# Run with debug output
DEBUG=* node generate-content.js

# Run with verbose logging
NODE_ENV=development node generate-content.js
```

## Customization

### Adding More Content Templates

Edit the `CONTENT_TEMPLATES` object in `generate-content.js`:

```javascript
const CONTENT_TEMPLATES = {
    titles: [
        'Your Custom Title 1',
        'Your Custom Title 2',
        // Add more titles
    ],
    descriptions: [
        'Your custom description 1',
        'Your custom description 2',
        // Add more descriptions
    ],
    // ... other templates
};
```

### Modifying Video Selection

Change the number of videos per trainer by modifying the `generateContentForTrainer` call:

```javascript
// Generate 5 videos per trainer instead of 3
const results = await this.generateContentForTrainer(
    credentials.phone, 
    credentials.password, 
    5 // Change this number
);
```

## Security Notes

- Never commit trainer credentials to version control
- Use environment variables for sensitive data in production
- Ensure proper file permissions on upload directories
- Consider using secure file upload validation in production
