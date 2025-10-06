import mongoose, { mongo } from "mongoose";

const InstructorSchema = new mongoose.Schema({
  username: { type: String, required: true },
  authentication: {
    password: { type: String, required: true, select: false },
  },
});

export const Instructor = mongoose.model("Instructor", InstructorSchema);

// CRUD functions
