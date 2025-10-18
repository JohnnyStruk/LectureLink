import mongoose, { mongo } from "mongoose";

const InstructorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  authentication: {
    password: { type: String, required: true, select: false },
    salt: { type: String, select: false },
    sessionToken: { type: String, select: false },
  },
});

export const Instructor = mongoose.model("Instructor", InstructorSchema);

export const createInstructor = (values: Record<string, any>) =>
  new Instructor(values).save().then((instructor) => instructor.toObject());

export const getInstructors = () => Instructor.find();

export const getInstructorById = (id: string) => Instructor.findById(id);

export const getInstructorByUserName = (username: string) =>
  Instructor.findOne({ username });

export const getInstructorBySessionToken = (sessionToken: string) =>
  Instructor.findOne({
    "authentication.sessionToken": sessionToken,
  });

export const updateInstructorById = (id: string, values: Record<string, any>) =>
  Instructor.findByIdAndUpdate(id, values);

export const deleteInstructorById = (id: string) =>
  Instructor.findByIdAndDelete({ _id: id });
