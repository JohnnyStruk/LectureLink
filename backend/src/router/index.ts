import express from "express";
import authentication from "./authentication";
import instructors from "./instructors";
import posts from "./posts";

const router = express.Router();

export default (): express.Router => {
  authentication(router);
  instructors(router);
  posts(router);

  return router;
};
