import mongoose, { mongo, Types } from "mongoose";

export interface IComment extends Document {
  _id: Types.ObjectId;
  isQuestion: Boolean;
  content: String;
  page: number;
  createdAt: Date;
  viewed: Boolean;
  votes: number;
  post: Types.ObjectId;
}

const CommentSchema = new mongoose.Schema({
  isQuestion: { type: Boolean, required: true },
  content: { type: String, required: true },
  page: { type: Number, required: true}, // the page of the post(pdf) that the comment was left on
  createdAt: { type: Date, default: Date.now },
  viewed: { type: Boolean, default: false },
  votes: { type: Number, default: 0 },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
});

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);

export const createComment = (values: Record<string, any>) =>
  new Comment(values).save().then((comment) => comment.toObject());

export const getComments = () => Comment.find();

export const getCommentById = (id: string) => Comment.findById(id);

export const updateCommentById = (id: string, values: Record<string, any>) =>
  Comment.findByIdAndUpdate(id);

export const deleteCommentById = (id: string) =>
  Comment.findByIdAndDelete({ _id: id });

// function to increase votes
