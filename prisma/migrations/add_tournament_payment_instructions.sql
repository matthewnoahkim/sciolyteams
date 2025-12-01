-- Add paymentInstructions column to Tournament table
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT;

