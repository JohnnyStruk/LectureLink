import express from "express";
import { authentication, random } from "../helpers";
import { createInstructor, getInstructorByUserName } from "../db/instructors";

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.sendStatus(400);
    }

    const instructor = await getInstructorByUserName(username).select(
      "+authentication.salt +authentication.password"
    );

    if (!instructor) {
      return res.sendStatus(400);
    }

    const expectedHash = authentication(
      instructor.authentication.salt,
      password
    );

    if (instructor.authentication.password != expectedHash) {
      return res.sendStatus(403);
    }

    const salt = random();
    instructor.authentication.sessionToken = authentication(
      salt,
      instructor._id.toString()
    );

    await instructor.save();

    const isProduction = process.env.NODE_ENV === 'production' || req.get('host')?.includes('kinneyan.com');
    res.cookie("LECTURELINK-AUTH", instructor.authentication.sessionToken, {
      domain: isProduction ? '.kinneyan.com' : 'localhost',
      path: "/",
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction
    });

    return res.status(200).json(instructor).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.sendStatus(400);
    }

    const existingInstructor = await getInstructorByUserName(username);

    if (existingInstructor) {
      return res.sendStatus(400);
    }

    const salt = random();
    const newInstructor = await createInstructor({
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    const sessionToken = authentication(random(), newInstructor._id.toString());
    const instructor = await getInstructorByUserName(username);
    instructor.authentication.sessionToken = sessionToken;
    await instructor.save();

    const isProduction = process.env.NODE_ENV === 'production' || req.get('host')?.includes('kinneyan.com');
    res.cookie("LECTURELINK-AUTH", sessionToken, {
      domain: isProduction ? '.kinneyan.com' : 'localhost',
      path: "/",
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction
    });

    return res.status(200).json(instructor).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
