export enum QuestionStatus {
  Draft = 'draft',
  PendingAnalysis = 'pending_analysis',
  Ready = 'ready',
  Failed = 'failed',
}

export enum ErrorType {
  Vocab = 'vocab',
  Pos = 'pos',
  Collocation = 'collocation',
  Grammar = 'grammar',
  Meaning = 'meaning',
  Locate = 'locate',
  Time = 'time',
  Careless = 'careless',
  Distract = 'distract',
}

export enum ReviewConfidence {
  Forgot = 'forgot',
  WrongFamiliar = 'wrong_familiar',
  CorrectUnsure = 'correct_unsure',
  CorrectConfident = 'correct_confident',
}

export enum AnalysisJobType {
  Ocr = 'ocr',
  Analyze = 'analyze',
}

export enum AnalysisJobStatus {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}
