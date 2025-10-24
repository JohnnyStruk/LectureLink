// Track unanswered questions per page

function key(lectureCode) {
  return `lecture_${lectureCode}_unanswered_pages`;
}

export function loadUnansweredPages(lectureCode) {
  try {
    const raw = localStorage.getItem(key(lectureCode));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveUnansweredPages(lectureCode, set) {
  localStorage.setItem(key(lectureCode), JSON.stringify(Array.from(set)));
}

export function markPageUnanswered(lectureCode, pageIndex) {
  const set = loadUnansweredPages(lectureCode);
  set.add(pageIndex);
  saveUnansweredPages(lectureCode, set);
  return set;
}

export function clearPageIfAllAnswered(lectureCode, pageIndex, questionsForPage = []) {
  const set = loadUnansweredPages(lectureCode);
  const hasUnanswered = (questionsForPage || []).some(q => !q.acknowledged);
  if (!hasUnanswered) {
    set.delete(pageIndex);
    saveUnansweredPages(lectureCode, set);
  }
  return set;
}

export function isPageUnanswered(lectureCode, pageIndex) {
  return loadUnansweredPages(lectureCode).has(pageIndex);
}


