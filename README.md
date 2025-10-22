# LectureLink

This is the README for LectureLink. Instructions to run the project TBA

## How to run:

```bash
npm install
npm start
```

To close the development server, press `Ctrl + C` and then type `y`.

# Backend API Outline
:text in url mean that the value is to be put in the url, ex:
/posts/:id would be /posts/12345

## Auth
todo

## Instructors
todo

## Posts
**POST /posts/upload**
Uploads pdf file to db as a new post for the logged in instructor
Must be signed into an instructor account
> Request Body: 
> `pdf : [file.pdf]`

> Response:
> HTTP 201
> `file: { id, filename, originalName, size, uploadDate, code, instructor { id, username } }`

**GET /posts/my-files**
Returns all posts for the currently logged in instructor
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
Deletes posts
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


