-- Add markedForReview column to AttemptAnswer table
-- Migration: add_marked_for_review

ALTER TABLE "AttemptAnswer" ADD COLUMN IF NOT EXISTS "markedForReview" BOOLEAN NOT NULL DEFAULT false;

