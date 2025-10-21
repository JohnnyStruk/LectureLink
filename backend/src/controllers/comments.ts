import express from "express";
import { Types } from 'mongoose';
import { CommentService} from "../helpers/commentService";

const commentService = new CommentService();

export class CommentController {
    async postComment(req: express.Request, res: express.Response) {
        try {
            //const { content, isQuestion, postId, page } = req.body;
            //console.log(req.body["page"]);
            const savedComment = await commentService.createComment(req.body);

            res.status(201).json({ message: 'Comment posted successfully', 
                comment: {
                    id: savedComment._id,
                    isQuestion: savedComment.isQuestion,
                    content: savedComment.content,
                    page: savedComment.page,
                    createdAt: savedComment.createdAt,
                    viewed: savedComment.viewed,
                    votes: savedComment.votes,
                    post: savedComment.post
                }
            });
        } catch (error) {
            console.log(error);
            return res.sendStatus(400);
        }
    };

    async getCommentsByPost(req: express.Request, res: express.Response) {
        try {
            //const { content, isQuestion, postId, page } = req.body;
            //console.log(req.body["page"]);
            const comments = await commentService.getCommentsByPost(req.params.postId);

            res.status(200).json(comments);
        } catch (error) {
            console.log(error);
            return res.sendStatus(400);
        }
    };

    async incrementVotes(req: express.Request, res: express.Response) {
        try {
            const votes = await commentService.incrementVotes(req.params.id);
            res.status(200).json({votes: votes});
        } catch (error) {
            console.log(error);
            return res.sendStatus(400);
        }
    };

    async toggleViewed(req: express.Request, res: express.Response) {
        try {
            const viewed = await commentService.toggleViewed(req.params.id);
            res.status(200).json({viewed: viewed});
        } catch (error) {
            console.log(error);
            return res.sendStatus(400);
        }
    };
}