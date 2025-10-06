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

// CRUD functions
// function to increase votes
