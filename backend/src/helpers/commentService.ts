import { Types } from 'mongoose';
import { Comment, IComment } from '../db/comments';
import { Post, IFile } from '../db/posts';
import { List } from 'lodash';

export class CommentService {
    async createComment(values: Record<string, any>): Promise<IComment> {
        const _post = await Post.findById(values["postId"]);

        const newComment = new Comment({
          isQuestion: values["isQuestion"],
          content: values["content"],
          page: values["page"],
          post: _post._id,     
        });

        return await newComment.save();
    };

    async getCommentsByPost(postId: string): Promise<IComment[]> {
        console.log(postId);
        if (!Types.ObjectId.isValid(postId)) {
            throw new Error('Invalid post ID');
        }

        const _post = await Post.findById(postId);

        if (!_post) {
            throw new Error('Post not found');
        }

        const comments = await Comment.find({ post: _post._id });
        return comments;
    };
}