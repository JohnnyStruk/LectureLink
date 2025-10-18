import mongoose, { mongo } from "mongoose";

const CommentSchema = new mongoose.Schema({
  isQuestion: { type: Boolean, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  viewed: { type: Boolean, required: true },
  votes: { type: Number, required: true, default: 0 },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
});

export const Comment = mongoose.model("Comment", CommentSchema);

export const createComment = (values: Record<string, any>) =>
  new Comment(values).save().then((comment) => comment.toObject());

export const getComments = () => Comment.find();

export const getCommentById = (id: string) => Comment.findById(id);

export const updateCommentById = (id: string, values: Record<string, any>) =>
  Comment.findByIdAndUpdate(id);

export const deleteCommentById = (id: string) =>
  Comment.findByIdAndDelete({ _id: id });

// function to increase votes
