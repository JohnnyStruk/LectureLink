import mongoose, { mongo, Schema, Document, Types } from "mongoose";

// interface to store file data
export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  data: Buffer;
  instructor: Types.ObjectId;
  code: string;
}

const PostSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  data: { type: Buffer, required: true },
  code: {type: String, required: true},

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: false, // temporarily false for testing
  },
});

export const Post = mongoose.model<IFile>("Post", PostSchema);

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
