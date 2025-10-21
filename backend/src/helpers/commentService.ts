import { Types } from 'mongoose';
import { Comment, IComment } from '../db/comments';
import { Post, IFile } from '../db/posts';

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
      }
}