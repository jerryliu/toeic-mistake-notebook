const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TOKEN_KEY = 'toeic_token';

export function getApiBase() {
  return API_BASE;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type QuestionDetail = {
  question: {
    id: string;
    stem: string | null;
    part: number | null;
    correctOption: string | null;
    userOption: string | null;
    errorType: string | null;
    status: string;
    imageUrl: string | null;
    sourceText: string | null;
    nextReviewAt: string | null;
  };
  options: Array<{ label: string; content: string }>;
  analysis: {
    questionType: string | null;
    correctExplanation: string | null;
    errorType: string | null;
    confidence: string | null;
    distractorExplanations: Record<string, string> | null;
  } | null;
};

export async function login(email: string, password: string) {
  const data = await request<{
    accessToken: string;
    user: { id: string; email: string; displayName: string };
  }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.accessToken);
  return data;
}

export async function ensureLoggedIn() {
  if (getToken()) return;
  await login('test@toeic.local', 'test1234');
}

export function createQuestion(body: {
  stem: string;
  options: Array<{ label: string; content: string }>;
  correctOption: string;
  userOption: string;
  part: number;
}) {
  return request<QuestionDetail>('/api/v1/questions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function uploadOcr(file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<{
    question: QuestionDetail;
    jobId: string;
    queueMode: string;
  }>('/api/v1/questions/ocr', {
    method: 'POST',
    body: form,
  });
}

export function getQuestion(id: string) {
  return request<QuestionDetail>(`/api/v1/questions/${id}`);
}

export function analyzeQuestion(id: string) {
  return request<{ jobId: string; queueMode: string }>(
    `/api/v1/questions/${id}/analyze`,
    { method: 'POST' },
  );
}

export function getJob(id: string) {
  return request<{ id: string; status: string; errorMessage?: string }>(
    `/api/v1/jobs/${id}`,
  );
}

export function updateQuestion(
  id: string,
  body: Record<string, unknown>,
) {
  return request<QuestionDetail>(`/api/v1/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function confirmQuestion(
  id: string,
  body: Record<string, unknown>,
) {
  return request<QuestionDetail>(`/api/v1/questions/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function pollJob(
  jobId: string,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
) {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const intervalMs = opts.intervalMs ?? 250;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await getJob(jobId);
    if (job.status === 'succeeded' || job.status === 'failed') {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('工作逾時');
}

export type ReviewConfidence =
  | 'forgot'
  | 'wrong_familiar'
  | 'correct_unsure'
  | 'correct_confident';

export type ReviewCard = {
  prompt: {
    id: string;
    stem: string | null;
    part: number | null;
    status: string;
    nextReviewAt: string | null;
    imageUrl: string | null;
    repetitionCount: number;
    intervalDays: number;
  };
  options: Array<{ label: string; content: string }>;
  reveal: {
    correctOption: string | null;
    originalUserOption: string | null;
    errorType: string | null;
    analysis: {
      questionType: string | null;
      correctExplanation: string | null;
      distractorExplanations: Record<string, string> | null;
      errorType: string | null;
      vocabTags: string[] | null;
      grammarTags: string[] | null;
      similarExamples: string[] | null;
    } | null;
  };
};

export function getTodayReviews() {
  return request<{ items: ReviewCard[]; count: number; asOf: string }>(
    '/api/v1/reviews/today',
  );
}

export function submitReview(
  questionId: string,
  body: {
    recalledOption: string;
    confidence: ReviewConfidence;
    reasonNote?: string;
  },
) {
  return request<{
    review: {
      id: string;
      isCorrect: boolean;
      confidence: ReviewConfidence;
      intervalDays: number;
      nextReviewAt: string;
    };
    question: {
      id: string;
      nextReviewAt: string;
      intervalDays: number;
      repetitionCount: number;
    };
  }>(`/api/v1/questions/${questionId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

