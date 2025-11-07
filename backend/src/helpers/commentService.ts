import { Types } from 'mongoose';
import { Comment, IComment } from '../db/comments';
import { Post, IFile } from '../db/posts';
import { List } from 'lodash';

export class CommentService {
    async createComment(values: Record<string, any>): Promise<IComment> {
        let postId = values["postId"];
        
        // If lectureCode provided instead of postId, look it up
        if (!postId && values["lectureCode"]) {
            const post = await Post.findOne({ code: values["lectureCode"] });
            if (post) {
                postId = post._id;
            }
        }

        if (postId) {
            const _post = await Post.findById(postId);
            if (_post) {
                const newComment = new Comment({
                  isQuestion: values["isQuestion"],
                  content: values["content"],
                  page: values["page"],
                  postId: _post._id,     
                });
                return await newComment.save();
            }
        }
        
        throw new Error('Post not found');
    };

    async getCommentsByPost(postId: string): Promise<IComment[]> {
        if (!Types.ObjectId.isValid(postId)) {
            throw new Error('Invalid post ID');
        }

        const _post = await Post.findById(postId);

        if (!_post) {
            throw new Error('Post not found');
        }

        const comments = await Comment.find({ postId: _post._id });
        return comments;
    };

    async incrementVotes(id: string): Promise<number> {
        const comment = await Comment.findById(id);
        comment.votes++;
        comment.save();
        return comment.votes;
    };

    async toggleViewed(id: string): Promise<boolean> {
        const comment = await Comment.findById(id);
        comment.viewed = !comment.viewed;
        comment.save();
        return comment.viewed;
    }

    async getById(id: string): Promise<IComment> {
        return await Comment.findById(id);
    };

    async getCommentsByLectureCode(lectureCode: string): Promise<IComment[]> {
        const post = await Post.findOne({ code: lectureCode });
        if (!post) {
            return [];
        }
        const comments = await Comment.find({ postId: post._id });
        return comments;
    };
}