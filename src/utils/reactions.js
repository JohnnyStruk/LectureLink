// Thumbs-up reactions for questions/comments

function key(lectureCode) {
  return `lecture_${lectureCode}_reactions`;
}

export function loadReactions(lectureCode) {
  try {
    const raw = localStorage.getItem(key(lectureCode));
    return raw ? JSON.parse(raw) : { questions: {}, comments: {} };
  } catch {
    return { questions: {}, comments: {} };
  }
}

export function saveReactions(lectureCode, data) {
  localStorage.setItem(key(lectureCode), JSON.stringify(data || { questions: {}, comments: {} }));
}

export function getVotes(lectureCode, type, itemId) {
  const data = loadReactions(lectureCode);
  const bag = type === 'question' ? data.questions : data.comments;
  return bag[itemId]?.count || 0;
}

export function hasVoted(lectureCode, type, itemId, voterId = 'anon') {
  const data = loadReactions(lectureCode);
  const bag = type === 'question' ? data.questions : data.comments;
  return !!bag[itemId]?.voters?.[voterId];
}

export function toggleVote(lectureCode, type, itemId, voterId = 'anon') {
  const data = loadReactions(lectureCode);
  const bag = type === 'question' ? data.questions : data.comments;
  const item = bag[itemId] || { count: 0, voters: {} };
  if (item.voters[voterId]) {
    item.count = Math.max(0, item.count - 1);
    delete item.voters[voterId];
  } else {
    item.count += 1;
    item.voters[voterId] = true;
  }
  bag[itemId] = item;
  saveReactions(lectureCode, data);
  return item.count;
}


