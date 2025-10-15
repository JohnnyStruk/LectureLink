import express from "express";
import {
  deleteInstructorById,
  getInstructorById,
  getInstructors,
} from "../db/instructors";

export const getAllInstructors = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const instructors = await getInstructors();

    return res.status(200).json(instructors);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const deleteInstructor = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const deletedInstructor = await deleteInstructorById(id);

    return res.json(deletedInstructor);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const updateInstructor = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.sendStatus(400);
    }

    const instructor = await getInstructorById(id);

    instructor.username = username;
    await instructor.save();

    return res.status(200).json(instructor).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
