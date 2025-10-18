import express from "express";
import authentication from "./authentication";
import instructors from "./instructors";

const router = express.Router();

export default (): express.Router => {
  authentication(router);
  instructors(router);

  return router;
};
