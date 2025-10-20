import express from "express";
import { get, identity, merge } from "lodash";
import { getInstructorBySessionToken } from "../db/instructors";
import { Types } from "mongoose";

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;
    const currentInstructorId = get(req, "identity._id") as Types.ObjectId;

    if (!currentInstructorId) {
      return res.sendStatus(403);
    }

    if (currentInstructorId.toString() != id) {
      return res.sendStatus(403);
    }

    next();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const sessionToken = req.cookies["LECTURELINK-AUTH"];

    if (!sessionToken) {
      return res.sendStatus(403);
    }

    const existingInstructor = await getInstructorBySessionToken(sessionToken);

    if (!existingInstructor) {
      return res.sendStatus(403);
    }

    merge(req, { identity: existingInstructor });

    return next();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
