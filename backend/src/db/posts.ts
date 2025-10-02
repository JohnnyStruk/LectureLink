import mongoose, { mongo } from "mongoose";

const PostSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // attribute for files, etc
});

export const Post = mongoose.model("Post", PostSchema);
