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

export const createPoll = (values: Record<string, any>) =>
  new Poll(values).save().then((poll) => poll.toObject());

export const getPolls = () => Poll.find();

export const getPollById = (id: string) => Poll.findById(id);

export const updatePollById = (id: string, values: Record<string, any>) =>
  Poll.findByIdAndUpdate(id);

export const deletePollById = (id: string) =>
  Poll.findByIdAndDelete({ _id: id });

// CRUD functions
