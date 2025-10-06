import mongoose, { mongo } from "mongoose";

const PollSchema = new mongoose.Schema({
  content: { type: String, required: true },
  isOpen: { type: Boolean, required: true },
  createdAt: { type: Date, required: true, default: Date.now },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
});

export const Poll = mongoose.model("Poll", PollSchema);

// CRUD functions
