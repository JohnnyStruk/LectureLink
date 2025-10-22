import express from "express";
import { Router } from 'express';
import { CommentController } from "../controllers/comments";

const commentController = new CommentController();

export default (router: express.Router) => {
    router.put('/comments/post', commentController.postComment);
    router.get('/posts/get-comments/:postId', commentController.getCommentsByPost);
    router.get('/comments/:id', commentController.getById);
    router.post('/comments/vote/:id', commentController.incrementVotes);
    router.post('/comments/toggle-viewed/:id', commentController.toggleViewed);
};