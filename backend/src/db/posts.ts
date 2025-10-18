import mongoose, { mongo } from "mongoose";

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
});

export const Post = mongoose.model("Post", PostSchema);

export const createPost = (values: Record<string, any>) =>
  new Post(values).save().then((post) => post.toObject());

export const getPosts = () => Post.find();

export const getPostById = (id: string) => Post.findById(id);

export const updatePostById = (id: string, values: Record<string, any>) =>
  Post.findByIdAndUpdate(id);

export const deletePostById = (id: string) =>
  Post.findByIdAndDelete({ _id: id });

// Comments GET function
// Polls GET function
