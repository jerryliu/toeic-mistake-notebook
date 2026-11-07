-- TOEIC mistake notebook — Phase 1 schema
-- Charset/collation for Chinese + English text

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NULL,
  display_name  VARCHAR(120)  NOT NULL,
  provider      VARCHAR(32)   NOT NULL DEFAULT 'local',
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id                 CHAR(36)      NOT NULL PRIMARY KEY,
  user_id            CHAR(36)      NOT NULL,
  part               TINYINT UNSIGNED NULL COMMENT '5 | 6 | 7',
  stem               TEXT          NULL,
  correct_option     CHAR(1)       NULL COMMENT 'A|B|C|D',
  user_option        CHAR(1)       NULL COMMENT 'A|B|C|D',
  error_type         VARCHAR(32)   NULL COMMENT 'vocab|pos|collocation|grammar|meaning|locate|time|careless|distract',
  status             VARCHAR(32)   NOT NULL DEFAULT 'draft' COMMENT 'draft|pending_analysis|ready|failed',
  source_text        MEDIUMTEXT    NULL,
  image_url          VARCHAR(512)  NULL,
  next_review_at     DATETIME(3)   NULL,
  repetition_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  interval_days      INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_questions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_questions_user_status (user_id, status),
  KEY idx_questions_user_next_review (user_id, next_review_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_options (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  question_id  CHAR(36)     NOT NULL,
  label        CHAR(1)      NOT NULL COMMENT 'A|B|C|D',
  content      TEXT         NOT NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_question_label (question_id, label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_analyses (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  question_id           CHAR(36)     NOT NULL,
  question_type         VARCHAR(64)  NULL,
  correct_explanation   MEDIUMTEXT   NULL,
  distractor_explanations JSON       NULL,
  error_type            VARCHAR(32)  NULL,
  vocab_tags            JSON         NULL,
  grammar_tags          JSON         NULL,
  similar_examples      JSON         NULL,
  raw_json              JSON         NULL,
  confidence            DECIMAL(4,3) NULL,
  confirmed_at          DATETIME(3)  NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_analyses_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_analyses_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id               CHAR(36)     NOT NULL PRIMARY KEY,
  question_id      CHAR(36)     NOT NULL,
  user_id          CHAR(36)     NOT NULL,
  recalled_option  CHAR(1)      NULL,
  is_correct       TINYINT(1)   NULL,
  confidence       VARCHAR(32)  NOT NULL COMMENT 'forgot|wrong_familiar|correct_unsure|correct_confident',
  reason_note      TEXT         NULL,
  interval_days    INT UNSIGNED NOT NULL DEFAULT 0,
  next_review_at   DATETIME(3)  NOT NULL,
  reviewed_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_reviews_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_reviews_user_reviewed (user_id, reviewed_at),
  KEY idx_reviews_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  question_id   CHAR(36)      NOT NULL,
  user_id       CHAR(36)      NOT NULL,
  job_type      VARCHAR(32)   NOT NULL COMMENT 'ocr|analyze',
  status        VARCHAR(32)   NOT NULL DEFAULT 'queued' COMMENT 'queued|running|succeeded|failed',
  attempts      INT UNSIGNED  NOT NULL DEFAULT 0,
  error_message TEXT          NULL,
  result_json   JSON          NULL,
  started_at    DATETIME(3)   NULL,
  finished_at   DATETIME(3)   NULL,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_jobs_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_jobs_status_created (status, created_at),
  KEY idx_jobs_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
