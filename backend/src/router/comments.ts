import express from "express";
import { Router } from 'express';
import { CommentController } from "../controllers/comments";

const commentController = new CommentController();

export default (router: express.Router) => {
    router.post('/comments/post', commentController.postComment);
    router.get('/comments/:postId', commentController.getCommentsByPost);
};