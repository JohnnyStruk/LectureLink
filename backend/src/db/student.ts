import mongoose, { mongo } from "mongoose";

const StudentSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  email: { type: String, required: true },
  authentication: {
    password: { type: String, required: true, select: false },
    salt: { type: String, select: false },
    sessionToken: { type: String, select: false },
  },
});

export const Student = mongoose.model("Student", StudentSchema);
