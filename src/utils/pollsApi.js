const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

async function http(method, path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function createPoll({ instructorId, lectureCode, question, options, durationSeconds }) {
  return http('POST', '/polls', {
    instructorId,
    lectureCode,
    question,
    options: options.map(text => ({ text })),
    durationSeconds
  });
}

export async function listPolls({ instructorId, lectureCode } = {}) {
  const params = [];
  if (instructorId) params.push(`instructorId=${encodeURIComponent(instructorId)}`);
  if (lectureCode) params.push(`lectureCode=${encodeURIComponent(lectureCode)}`);
  const query = params.length ? `?${params.join('&')}` : '';
  return http('GET', `/polls${query}`);
}

export async function getPoll(pollId) {
  return http('GET', `/polls/${encodeURIComponent(pollId)}`);
}

export async function updatePoll(pollId, updates) {
  return http('PUT', `/polls/${encodeURIComponent(pollId)}`, updates);
}

export async function deletePoll(pollId) {
  return http('DELETE', `/polls/${encodeURIComponent(pollId)}`);
}

export async function activatePoll(pollId) {
  return http('POST', `/polls/${encodeURIComponent(pollId)}/activate`);
}

export async function voteOnPoll(pollId, optionIndex) {
  return http('POST', `/polls/${encodeURIComponent(pollId)}/vote`, { optionIndex });
}

export function loadSavedPolls(instructorId) {
  try {
    const raw = localStorage.getItem(`saved_polls_${instructorId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSavedPolls(instructorId, polls) {
  localStorage.setItem(`saved_polls_${instructorId}`, JSON.stringify(polls || []));
}


