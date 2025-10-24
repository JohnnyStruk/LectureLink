import express from "express";
import {
  createPoll,
  listPolls,
  getPoll,
  updatePoll,
  deletePoll,
  activatePoll,
  voteOnPoll
} from "../controllers/polls";

export default (router: express.Router) => {
  router.post('/polls', createPoll);
  router.get('/polls', listPolls);
  router.get('/polls/:id', getPoll);
  router.put('/polls/:id', updatePoll);
  router.delete('/polls/:id', deletePoll);
  router.post('/polls/:id/activate', activatePoll);
  router.post('/polls/:id/vote', voteOnPoll);
};


