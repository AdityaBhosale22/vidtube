# 🎬 **FusionCast – Hybrid Video & Microblogging Backend**

A production-ready backend built using **Node.js**, **Express.js**, **MongoDB**, **Cloudinary**, and **JWT Authentication**.
Designed to power a modern social content platform combining YouTube-style video sharing and Twitter-style micro-tweets, complete with users, videos, playlists, comments, likes, subscriptions, and analytics.

---

<div align="center">

### 🔥 Powerful API Backend for Modern Applications

![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Express.js](https://img.shields.io/badge/Framework-Express-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-blue?logo=cloudinary)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)

</div>

---

# 📚 **Table of Contents**

* [Overview](#-overview)
* [Features](#-features)
* [Tech Stack](#️-tech-stack)
* [Project Structure](#-project-structure)
* [Installation](#-installation)
* [Environment Variables](#-environment-variables)
* [API Endpoints](#-api-endpoints)
* [Screenshots](#-screenshots)
* [Future Enhancements](#-future-enhancements)

---

# 🔍 **Overview**

**FusionCast Backend** is a complete backend solution for a video plus tweet sharing platform.
It includes user authentication, video management, playlist support, tweets, comments, likes, subscriptions, dashboards, and more.

---

# 🚀 **Features**

### 👤 **User Management**

* Register, login, logout
* Access/refresh token based authentication
* Update profile, password, avatar, cover image
* View user channel info
* Watch history tracking

### 🎥 **Video Management**

* Upload video & thumbnail
* Update and delete video
* Toggle publish status
* Fetch single/all videos

### 🎵 **Playlist Management**

* Create, update, delete playlists
* Add/remove videos
* Fetch user playlists

### 📝 **Tweets**

* Create, update, delete tweets
* Fetch tweets for a user

### 💬 **Comments**

* Add, edit, delete comments
* Fetch comments for a video

### ❤️ **Likes**

* Like/unlike videos, comments, tweets
* Fetch liked videos

### 🔔 **Subscriptions**

* Subscribe/unsubscribe to channels
* Get subscribers & subscribed channels

### 📊 **Dashboard**

* Channel stats (views, likes, subs)
* Channel videos

### ☁️ **File Uploads**

* Multer for local temp storage
* Cloudinary for final upload

---

# 🧰 **Tech Stack**

| Layer           | Technology                    |
| --------------- | ----------------------------- |
| Backend Runtime | Node.js                       |
| Framework       | Express.js                    |
| Database        | MongoDB + Mongoose            |
| Authentication  | JWT (Access + Refresh Tokens) |
| File Uploads    | Multer                        |
| Media Hosting   | Cloudinary                    |
| Env Management  | dotenv                        |

---

# 📁 **Project Structure**

```
src/
 ├── controllers/
 ├── routes/
 ├── models/
 ├── middleware/
 ├── utils/
 ├── config/
 └── app.js

public/
 └── temp/       (temporary uploaded files)

test/
```

---

# ⚙️ **Installation**

### 1️⃣ Clone the repository

```bash
git clone https://github.com/AdityaBhosale22/fusioncast.git
cd fusioncast
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Add `.env` file

(See next section)

### 4️⃣ Start the development server

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

---

# 🔐 **Environment Variables**

Create a `.env` file in the root:

```
PORT=8000

MONGODB_URI=<your-mongodb-uri>

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CORS_ORIGIN=*
```

---

# 📡 **API Endpoints**

### **Users (`/api/v1/users`)**

* POST `/register`
* POST `/login`
* POST `/logout`
* POST `/refresh-token`
* GET `/current-user`
* PATCH `/update-account`
* PATCH `/avatar`
* PATCH `/cover-image`
* GET `/c/:username`
* GET `/history`

---

### **Videos (`/api/v1/videos`)**

* GET `/`
* POST `/`
* GET `/:videoId`
* PATCH `/:videoId`
* DELETE `/:videoId`
* PATCH `/toggle/publish/:videoId`

---

### **Playlists (`/api/v1/playlist`)**

* POST `/`
* GET `/user/:userId`
* GET `/:playlistId`
* PATCH `/add/:videoId/:playlistId`
* PATCH `/remove/:videoId/:playlistId`
* DELETE `/:playlistId`
* PATCH `/:playlistId`

---

### **Tweets (`/api/v1/tweet`)**

* POST `/`
* GET `/user/:userId`
* PATCH `/:tweetId`
* DELETE `/:tweetId`

---

### **Comments (`/api/v1/comments`)**

* GET `/:videoId`
* POST `/:videoId`
* PATCH `/c/:commentId`
* DELETE `/c/:commentId`

---

### **Likes (`/api/v1/likes`)**

* POST `/toggle/v/:videoId`
* POST `/toggle/c/:commentId`
* POST `/toggle/t/:tweetId`
* GET `/videos`

---

### **Subscriptions (`/api/v1/subscription`)**

* POST `/c/:channelId`
* GET `/c/:channelId`
* GET `/u/:subscriberId`

---

### **Dashboard (`/api/v1/dashboard`)**

* GET `/stats`
* GET `/videos`

---

### **Health Check**

* GET `/api/v1/healthcheck`

---

# 📸 **Screenshots (Recommended)**

Add these for a professional README:

### ✅ Postman API Screenshots

* Login API
* Video upload
* Playlist creation
* Like/Comment API response

### ✅ Folder Structure Screenshot

```
src/
public/
test/
```

### ✅ Cloudinary upload logs (optional)

### 📌 Suggestion:

Create a `/screenshots` folder in your repo and store all images there.

---

# 🔮 **Future Enhancements**

Some ideas to expand the project:

* OAuth login (Google / GitHub)
* Video streaming with range requests
* Notifications system
* Admin dashboard
* Rate limiting & security improvements
* AI-based video recommendations

---
