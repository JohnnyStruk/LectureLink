import express from "express";

import {
  deleteInstructor,
  getAllInstructors,
  updateInstructor,
} from "../controllers/instructors";
import { isAuthenticated, isOwner } from "../middlewares";

export default (router: express.Router) => {
  // router.get("/instructors", isAuthenticated, getAllInstructors);
  router.get("/instructors", getAllInstructors);
  router.delete("/instructors/:id", isAuthenticated, isOwner, deleteInstructor);
  router.patch("/instructors/:id", isAuthenticated, isOwner, updateInstructor);
};
