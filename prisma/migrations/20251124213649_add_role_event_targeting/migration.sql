-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_TEXT', 'LONG_TEXT', 'NUMERIC');

-- CreateEnum
CREATE TYPE "TestAssignmentScope" AS ENUM ('TEAM', 'SUBTEAM', 'PERSONAL');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "ProctorEventKind" AS ENUM ('BLUR', 'VISIBILITY_HIDDEN', 'EXIT_FULLSCREEN', 'DEVTOOLS_OPEN', 'PASTE', 'COPY', 'CONTEXTMENU', 'TAB_SWITCH', 'RESIZE', 'NETWORK_OFFLINE', 'NETWORK_ONLINE', 'MULTI_MONITOR_HINT');

-- CreateEnum
CREATE TYPE "ScoreReleaseMode" AS ENUM ('NONE', 'SCORE_ONLY', 'SCORE_WITH_WRONG', 'FULL_TEST');

-- CreateEnum
CREATE TYPE "TestAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'CLOSE', 'RESET_PASSWORD', 'MANUAL_GRADE', 'INVALIDATE_ATTEMPT');

-- CreateEnum
CREATE TYPE "AiSuggestionStatus" AS ENUM ('REQUESTED', 'SUGGESTED', 'FAILED', 'ACCEPTED', 'OVERRIDDEN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('USER_ACTION', 'ADMIN_ACTION', 'SYSTEM_EVENT', 'API_USAGE', 'ERROR', 'WARNING');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "logType" "LogType" NOT NULL DEFAULT 'SYSTEM_EVENT',
ADD COLUMN     "route" TEXT,
ADD COLUMN     "severity" "SeverityLevel" NOT NULL DEFAULT 'INFO';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "important" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AnnouncementVisibility" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "targetRole" TEXT;

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "important" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rsvpEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CalendarEventTarget" (
    "id" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "targetRole" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEventTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "announcementId" TEXT,
    "calendarEventId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "purchaseRequestId" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT,
    "subteamId" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "estimatedAmount" DOUBLE PRECISION NOT NULL,
    "justification" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminOverride" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "subteamId" TEXT,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudget" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "maxBudget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subteamId" TEXT,

    CONSTRAINT "EventBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "allowLateUntil" TIMESTAMP(3),
    "randomizeQuestionOrder" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptionOrder" BOOLEAN NOT NULL DEFAULT false,
    "requireFullscreen" BOOLEAN NOT NULL DEFAULT true,
    "testPasswordHash" TEXT,
    "testPasswordPlaintext" TEXT,
    "releaseScoresAt" TIMESTAMP(3),
    "maxAttempts" INTEGER,
    "scoreReleaseMode" "ScoreReleaseMode" NOT NULL DEFAULT 'FULL_TEST',
    "createdByMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSection" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sectionId" TEXT,
    "type" "QuestionType" NOT NULL,
    "promptMd" TEXT NOT NULL,
    "explanation" TEXT,
    "points" DECIMAL(5,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "numericTolerance" DECIMAL(8,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAssignment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "assignedScope" "TestAssignmentScope" NOT NULL,
    "subteamId" TEXT,
    "targetMembershipId" TEXT,
    "targetRole" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "gradeEarned" DECIMAL(6,2),
    "proctoringScore" INTEGER,
    "clientFingerprintHash" TEXT,
    "ipAtStart" TEXT,
    "ipAtSubmit" TEXT,
    "userAgentAtStart" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "timeOffPageSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "selectedOptionIds" JSONB,
    "numericAnswer" DECIMAL(16,6),
    "pointsAwarded" DECIMAL(5,2),
    "gradedAt" TIMESTAMP(3),
    "graderNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "kind" "ProctorEventKind" NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "ProctorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeAdjustment" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "graderMembershipId" TEXT NOT NULL,
    "deltaPoints" DECIMAL(6,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGradingSuggestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedByMembershipId" TEXT,
    "suggestedPoints" DECIMAL(5,2) NOT NULL,
    "maxPoints" DECIMAL(5,2) NOT NULL,
    "explanation" TEXT NOT NULL,
    "strengths" TEXT,
    "gaps" TEXT,
    "rubricAlignment" TEXT,
    "rawResponse" JSONB,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'SUGGESTED',
    "acceptedPoints" DECIMAL(5,2),
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "acceptedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGradingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAudit" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "actorMembershipId" TEXT NOT NULL,
    "action" "TestAuditAction" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLog" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "userId" TEXT,
    "executionTime" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "responseSize" INTEGER,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "userId" TEXT,
    "route" TEXT,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'ERROR',
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEventTarget_calendarEventId_idx" ON "CalendarEventTarget"("calendarEventId");

-- CreateIndex
CREATE INDEX "CalendarEventTarget_eventId_idx" ON "CalendarEventTarget"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventTarget_targetRole_idx" ON "CalendarEventTarget"("targetRole");

-- CreateIndex
CREATE INDEX "Attachment_announcementId_idx" ON "Attachment"("announcementId");

-- CreateIndex
CREATE INDEX "Attachment_calendarEventId_idx" ON "Attachment"("calendarEventId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_purchaseRequestId_key" ON "Expense"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Expense_teamId_idx" ON "Expense"("teamId");

-- CreateIndex
CREATE INDEX "Expense_eventId_idx" ON "Expense"("eventId");

-- CreateIndex
CREATE INDEX "Expense_subteamId_idx" ON "Expense"("subteamId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_addedById_idx" ON "Expense"("addedById");

-- CreateIndex
CREATE INDEX "PurchaseRequest_teamId_idx" ON "PurchaseRequest"("teamId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_eventId_idx" ON "PurchaseRequest"("eventId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_subteamId_idx" ON "PurchaseRequest"("subteamId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requesterId_idx" ON "PurchaseRequest"("requesterId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_createdAt_idx" ON "PurchaseRequest"("createdAt");

-- CreateIndex
CREATE INDEX "EventBudget_teamId_idx" ON "EventBudget"("teamId");

-- CreateIndex
CREATE INDEX "EventBudget_eventId_idx" ON "EventBudget"("eventId");

-- CreateIndex
CREATE INDEX "EventBudget_subteamId_idx" ON "EventBudget"("subteamId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBudget_teamId_eventId_subteamId_key" ON "EventBudget"("teamId", "eventId", "subteamId");

-- CreateIndex
CREATE INDEX "Test_teamId_idx" ON "Test"("teamId");

-- CreateIndex
CREATE INDEX "Test_status_idx" ON "Test"("status");

-- CreateIndex
CREATE INDEX "Test_createdByMembershipId_idx" ON "Test"("createdByMembershipId");

-- CreateIndex
CREATE INDEX "TestSection_testId_idx" ON "TestSection"("testId");

-- CreateIndex
CREATE INDEX "Question_testId_idx" ON "Question"("testId");

-- CreateIndex
CREATE INDEX "Question_sectionId_idx" ON "Question"("sectionId");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "TestAssignment_testId_idx" ON "TestAssignment"("testId");

-- CreateIndex
CREATE INDEX "TestAssignment_subteamId_idx" ON "TestAssignment"("subteamId");

-- CreateIndex
CREATE INDEX "TestAssignment_targetMembershipId_idx" ON "TestAssignment"("targetMembershipId");

-- CreateIndex
CREATE INDEX "TestAssignment_eventId_idx" ON "TestAssignment"("eventId");

-- CreateIndex
CREATE INDEX "TestAssignment_targetRole_idx" ON "TestAssignment"("targetRole");

-- CreateIndex
CREATE INDEX "TestAttempt_testId_idx" ON "TestAttempt"("testId");

-- CreateIndex
CREATE INDEX "TestAttempt_membershipId_idx" ON "TestAttempt"("membershipId");

-- CreateIndex
CREATE INDEX "TestAttempt_membershipId_testId_idx" ON "TestAttempt"("membershipId", "testId");

-- CreateIndex
CREATE INDEX "TestAttempt_status_idx" ON "TestAttempt"("status");

-- CreateIndex
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "AttemptAnswer_questionId_idx" ON "AttemptAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "ProctorEvent_attemptId_idx" ON "ProctorEvent"("attemptId");

-- CreateIndex
CREATE INDEX "ProctorEvent_ts_idx" ON "ProctorEvent"("ts");

-- CreateIndex
CREATE INDEX "GradeAdjustment_attemptId_idx" ON "GradeAdjustment"("attemptId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_attemptId_idx" ON "AiGradingSuggestion"("attemptId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_answerId_idx" ON "AiGradingSuggestion"("answerId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_questionId_idx" ON "AiGradingSuggestion"("questionId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_testId_idx" ON "AiGradingSuggestion"("testId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_requestedByUserId_idx" ON "AiGradingSuggestion"("requestedByUserId");

-- CreateIndex
CREATE INDEX "AiGradingSuggestion_status_idx" ON "AiGradingSuggestion"("status");

-- CreateIndex
CREATE INDEX "TestAudit_testId_idx" ON "TestAudit"("testId");

-- CreateIndex
CREATE INDEX "TestAudit_actorMembershipId_idx" ON "TestAudit"("actorMembershipId");

-- CreateIndex
CREATE INDEX "TestAudit_createdAt_idx" ON "TestAudit"("createdAt");

-- CreateIndex
CREATE INDEX "ApiLog_userId_idx" ON "ApiLog"("userId");

-- CreateIndex
CREATE INDEX "ApiLog_timestamp_idx" ON "ApiLog"("timestamp");

-- CreateIndex
CREATE INDEX "ApiLog_route_idx" ON "ApiLog"("route");

-- CreateIndex
CREATE INDEX "ApiLog_method_idx" ON "ApiLog"("method");

-- CreateIndex
CREATE INDEX "ApiLog_statusCode_idx" ON "ApiLog"("statusCode");

-- CreateIndex
CREATE INDEX "ApiLog_executionTime_idx" ON "ApiLog"("executionTime");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_timestamp_idx" ON "ErrorLog"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_severity_idx" ON "ErrorLog"("severity");

-- CreateIndex
CREATE INDEX "ErrorLog_route_idx" ON "ErrorLog"("route");

-- CreateIndex
CREATE INDEX "ErrorLog_resolved_idx" ON "ErrorLog"("resolved");

-- CreateIndex
CREATE INDEX "ActivityLog_logType_idx" ON "ActivityLog"("logType");

-- CreateIndex
CREATE INDEX "ActivityLog_severity_idx" ON "ActivityLog"("severity");

-- CreateIndex
CREATE INDEX "ActivityLog_route_idx" ON "ActivityLog"("route");

-- CreateIndex
CREATE INDEX "AnnouncementVisibility_eventId_idx" ON "AnnouncementVisibility"("eventId");

-- CreateIndex
CREATE INDEX "AnnouncementVisibility_targetRole_idx" ON "AnnouncementVisibility"("targetRole");

-- AddForeignKey
ALTER TABLE "AnnouncementVisibility" ADD CONSTRAINT "AnnouncementVisibility_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventTarget" ADD CONSTRAINT "CalendarEventTarget_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventTarget" ADD CONSTRAINT "CalendarEventTarget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_subteamId_fkey" FOREIGN KEY ("subteamId") REFERENCES "Subteam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_subteamId_fkey" FOREIGN KEY ("subteamId") REFERENCES "Subteam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudget" ADD CONSTRAINT "EventBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudget" ADD CONSTRAINT "EventBudget_subteamId_fkey" FOREIGN KEY ("subteamId") REFERENCES "Subteam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudget" ADD CONSTRAINT "EventBudget_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSection" ADD CONSTRAINT "TestSection_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TestSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAssignment" ADD CONSTRAINT "TestAssignment_subteamId_fkey" FOREIGN KEY ("subteamId") REFERENCES "Subteam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAssignment" ADD CONSTRAINT "TestAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAssignment" ADD CONSTRAINT "TestAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorEvent" ADD CONSTRAINT "ProctorEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAdjustment" ADD CONSTRAINT "GradeAdjustment_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGradingSuggestion" ADD CONSTRAINT "AiGradingSuggestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGradingSuggestion" ADD CONSTRAINT "AiGradingSuggestion_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "AttemptAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGradingSuggestion" ADD CONSTRAINT "AiGradingSuggestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGradingSuggestion" ADD CONSTRAINT "AiGradingSuggestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAudit" ADD CONSTRAINT "TestAudit_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiLog" ADD CONSTRAINT "ApiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
