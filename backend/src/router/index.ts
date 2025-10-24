import express from "express";
import authentication from "./authentication";
import instructors from "./instructors";
import posts from "./posts";
import comments from "./comments";
import polls from "./polls";

const router = express.Router();

export default (): express.Router => {
  authentication(router);
  instructors(router);
  posts(router);
  comments(router);
  polls(router);

  return router;
};
