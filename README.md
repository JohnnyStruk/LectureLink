# LectureLink

LectureLink is a platform designed to improve student engagement in synchronous online classes. It allows instructors to upload lecture materials and students to access them using unique session codes, where they can post questions and comments on specific slides/pages.

## Features

### For Instructors:
- Upload lecture files (PDF only)
- Each uploaded file automatically receives a unique 6-character access code
- View all uploaded lectures with their access codes on the dashboard
- Preview lectures with the integrated PDF viewer
- See student questions and comments per slide in real-time
- Acknowledge student questions to mark them as answered
- Delete lectures when needed

### For Students:
- Enter a 6-character session code to access a specific lecture
- View lecture slides/pages with thumbnail navigation
- Post questions and comments on specific slides
- All interactions are organized by slide number

## Setup

### Prerequisites
- Node.js installed

### Installation

**Install dependencies for both frontend and backend:**
```bash
npm install
cd backend
npm install
cd ..
```

### Running the Application

**To start both frontend and backend simultaneously:**
```bash
npm run dev
```

**Or run them separately:**
- Frontend only: `npm start` (runs on http://localhost:3000)
- Backend only: `npm run server` (runs on http://localhost:8080)

To close the development servers, press `Ctrl + C`.

### Database Configuration (Required)

**MongoDB Setup Required:**

This application requires a MongoDB database for authentication and data storage. You have two options:

**Option 1: MongoDB Atlas (Recommended)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Create a database user
4. Get your connection string

**Option 2: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/lecturelink`

**Configure the Application:**
1. Create a file `backend/.env` in the backend directory
2. Add your MongoDB connection string:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/lecturelink
   ```

**Note:** The `.env` file is not included in the repository for security reasons.

## Quick Start Guide

### As an Instructor:
1. Click "Instructor Login" button
2. Create a username and password and login to your dashboard.
3. Click "Upload" to add lecture files
4. Each file will display with a unique 6-character code (e.g., "A7X2K9")
5. Share this code with your students
6. Click on any lecture to preview it and see student questions/comments

### As a Student:
1. On the homepage, enter the 6-character code provided by your instructor
2. Click "Join Session" to access the lecture
3. Navigate through slides using the thumbnails on the left
4. View other students' questions and comments in the right sidebar
5. See which questions have been answered by the professor (marked as "Answered")
6. Type your question or comment in the input field at the bottom
7. Click "Post Question" or "Post Comment" to submit
8. Your posts will appear in real-time for other students and the professor

# Backend API Outline
:text in url mean that the value is to be put in the url, ex:
/posts/:id would be /posts/12345

## Auth
**POST /auth/register**
Registers a new instructor
> Request Body:
> `username: String`
> `password: String`

**POST /auth/login**
Logs the instructor in
> Request Body:
> `username: String`
> `password: String`

## Instructors
todo

## Posts
**POST /posts/upload**
Uploads pdf file to db as a new post for the logged in instructor.
Must be signed into an instructor account
> Request Body: 
> `pdf : [file.pdf]`

> Response:
> HTTP 201
> `file: { id, filename, originalName, size, uploadDate, code, instructor { id, username } }`

**GET /posts/my-files**
Returns all posts for the currently logged in instructor.
Must be signed into an instructor account
> Response (array):
> HTTP 200
> `{ id, filename, originalName, size, uploadDate, code, instructor { id, username } }`

**GET /posts/code/:code**
Gets a post by the 6-digit code
> Response:
> HTTP 200
>` { _id, filename, originalName, size, data { data[...] } }`

**GET /posts/download/:id**
Downloads the pdf for the post 
> Response:
> HTTP 200

**GET /posts/view/:id**
Opens a preview of the pdf for the post
> Response:
> HTTP 200

**GET /posts/get-comments/:id**
Gets all the comments for the post
> Response (array):
> HTTP 200
> `{ _id, isQuestion, content, page, viewed, votes, postId, createdAt }`

**DELETE /posts/:id**
Deletes posts.
Must be signed in
> Response:
> HTTP 200

## Comments
**PUT /comments/post**
Uploads a comment
> Request Body:
> `postId: String`
> `page: int`
> `content: String`
> `isQuestion: boolean`

>Response
>HTTP 201
>`comment: { id, isQuestion, content, page, createdAt, viewed, votes, postId }`

**GET /comments/:id**
Gets a comment 
>Response:
>HTTP 200
>`{ _id, isQuestion, content, page, viewed, votes, postId, createdAt }`

**POST /comments/vote/:id**
Increments the vote count for the comment by 1
> Response:
> HTTP 200
> `{ votes }`

**POST /comments/toggle-viewed/:id**
Toggled the viewed field
> Response:
> HTTP 200
> `{ viewed }`


