-- Add calculator support to tests
-- Migration: add_calculator_support

-- Create enum for calculator types
CREATE TYPE "CalculatorType" AS ENUM ('FOUR_FUNCTION', 'SCIENTIFIC', 'GRAPHING');

-- Add calculator columns to Test table
ALTER TABLE "Test" ADD COLUMN "allowCalculator" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Test" ADD COLUMN "calculatorType" "CalculatorType";

-- Create indexes (optional, for potential future filtering)
CREATE INDEX "Test_allowCalculator_idx" ON "Test"("allowCalculator");

