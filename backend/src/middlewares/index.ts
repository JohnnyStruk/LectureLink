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
    console.log('Auth check - All cookies:', req.cookies);
    const sessionToken = req.cookies["LECTURELINK-AUTH"];
    console.log('Auth check - Session token:', sessionToken ? 'Present' : 'Missing');

    if (!sessionToken) {
      console.log('Auth failed: No session token');
      return res.sendStatus(403);
    }

    const existingInstructor = await getInstructorBySessionToken(sessionToken);

    if (!existingInstructor) {
      console.log('Auth failed: Invalid session token');
      return res.sendStatus(403);
    }

    console.log('Auth success for instructor:', existingInstructor.username);
    merge(req, { identity: existingInstructor });

    return next();
  } catch (error) {
    console.log('Auth error:', error);
    return res.sendStatus(400);
  }
};
