import { Request, Response } from 'express';

type PollOption = { text: string; votes: number };
type Poll = {
  id: string;
  instructorId: string;
  lectureCode?: string;
  question: string;
  options: PollOption[];
  durationSeconds: 30 | 60 | 90 | 120;
  isActive: boolean;
  createdAt: string;
  endsAt?: string | null;
};

// In-memory poll store
const polls = new Map<string, Poll>();

function nowIso() { return new Date().toISOString(); }

export const createPoll = (req: Request, res: Response) => {
  try {
    const { instructorId, lectureCode, question, options, durationSeconds } = req.body || {};
    if (!instructorId || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    const dur = Number(durationSeconds);
    if (![30, 60, 90, 120].includes(dur)) {
      return res.status(400).json({ message: 'Invalid duration' });
    }
    const poll: Poll = {
      id: generateId(),
      instructorId,
      lectureCode,
      question,
      options: options.map((t: any) => ({ text: String(t.text ?? t), votes: 0 })),
      durationSeconds: dur as 30 | 60 | 90 | 120,
      isActive: false,
      createdAt: nowIso(),
      endsAt: null
    };
    polls.set(poll.id, poll);
    return res.status(201).json(poll);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to create poll' });
  }
};

export const listPolls = (req: Request, res: Response) => {
  const { instructorId, lectureCode } = req.query as { instructorId?: string; lectureCode?: string };
  let list = Array.from(polls.values());
  if (instructorId) list = list.filter(p => p.instructorId === instructorId);
  if (lectureCode) list = list.filter(p => p.lectureCode === lectureCode);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json(list);
};

export const getPoll = (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Not found' });
  return res.json(poll);
};

export const updatePoll = (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Not found' });
  const updates = req.body || {};
  const updated: Poll = { ...poll };
  if (typeof updates.question === 'string') updated.question = updates.question;
  if (Array.isArray(updates.options) && updates.options.length >= 2) {
    updated.options = updates.options.map((t: any, idx: number) => ({
      text: String(t.text ?? t),
      votes: poll.options[idx]?.votes ?? 0
    }));
  }
  if (typeof updates.durationSeconds !== 'undefined') {
    const dur = Number(updates.durationSeconds);
    if ([30, 60, 90, 120].includes(dur)) updated.durationSeconds = dur as 30 | 60 | 90 | 120;
  }
  polls.set(updated.id, updated);
  return res.json(updated);
};

export const deletePoll = (req: Request, res: Response) => {
  const existed = polls.delete(req.params.id);
  return res.json({ success: existed });
};

export const activatePoll = (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Not found' });
  const endsAt = new Date(Date.now() + poll.durationSeconds * 1000).toISOString();
  poll.isActive = true;
  poll.endsAt = endsAt;
  polls.set(poll.id, poll);
  return res.json(poll);
};

export const voteOnPoll = (req: Request, res: Response) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Not found' });
  const { optionIndex } = req.body || {};
  const idx = Number(optionIndex);
  if (!(idx >= 0 && idx < poll.options.length)) return res.status(400).json({ message: 'Bad option' });
  poll.options[idx].votes += 1;
  polls.set(poll.id, poll);
  return res.json(poll);
};
function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

