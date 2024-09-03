
# 🎥 YouTube Clone Backend

Welcome to the YouTube Clone Backend! This project replicates the core functionalities of YouTube, providing a powerful API to manage users, videos, comments, likes, playlists, and subscriptions. Built with modern technologies, this backend is designed to be secure, scalable, and easy to integrate with a frontend application.

## 🚀 Key Features

### 👤 User Authentication and Authorization
- 📝 **Registration**: Users can sign up with their full name, username, email, password, avatar, and cover image.
- 🔐 **Login**: Log in with your username or email and password.
- 🛡️ **JWT Tokens**: Secure authentication with access and refresh tokens.
- 🔑 **Password Management**: Change your password and manage account details.
- 🖼️ **Profile Management**: Update your avatar, cover image, and other profile info.

### 📹 Video Management
- 📤 **Upload Videos**: Upload videos with a title, description, and thumbnail.
- 🔍 **Video Details**: Retrieve detailed information like views, duration, and ownership.
- 🚀 **Video Publishing**: Toggle the publish status of your videos.
- 🗑️ **Video Deletion**: Delete videos from the platform.

### 💬 Comments
- ✏️ **Add Comments**: Post comments on videos.
- 🔄 **Manage Comments**: Update or delete your comments.
- 🔍 **Retrieve Comments**: View all comments for a specific video and check if you've commented.

### 👍 Likes
- ❤️ **Toggle Likes**: Like or unlike videos, comments, and tweets.
- 📊 **Retrieve Likes**: View liked videos and check likes for a specific video.

### 📁 Playlists
- ➕ **Create Playlists**: Organize your videos into playlists.
- 🎥 **Add/Remove Videos**: Add or remove videos from playlists.
- 🔒 **Public/Private Playlists**: Control the visibility of your playlists.
- 🔍 **Retrieve Playlists**: View playlists by user or playlist ID.

### 🔔 Subscriptions
- 🔄 **Manage Subscriptions**: Subscribe or unsubscribe to channels.
- 📺 **Retrieve Subscriptions**: View your subscribed channels and channel subscribers.

## 🛠️ Technologies Used
- **Node.js**: JavaScript runtime for building the backend.
- **Express.js**: Web framework for building the API.
- **MongoDB**: NoSQL database for storing data.
- **Mongoose**: ODM library for MongoDB.
- **JWT**: Secure authentication and authorization.
- **Cloudinary**: Media management service for storing avatars, cover images, and videos.
- **Multer**: Middleware for handling file uploads.
- **bcrypt**: Library for hashing passwords.
- **dotenv**: Module for loading environment variables.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing.
- **morgan**: HTTP request logger middleware.

## 📂 Project Structure
The project follows a modular structure to keep the codebase organized and maintainable.

- **controllers/**: Handles API requests and responses.
- **models/**: Defines the data schemas and models for MongoDB.
- **middleware/**: Contains functions for authentication, error handling, and file uploads.
- **utils/**: Utility functions and classes like custom error handling and token generation.

## 🚀 Getting Started
To run this project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/suraj00415/Youtube_Clone_Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```bash
   PORT=5000
   MONGO_URI=your_mongo_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```