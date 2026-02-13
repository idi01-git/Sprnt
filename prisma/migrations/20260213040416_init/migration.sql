-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student');

-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('super_admin', 'admin', 'reviewer');

-- CreateEnum
CREATE TYPE "study_level" AS ENUM ('9th', '10th', '11th', '12th', 'College 1st Year', 'College 2nd Year', 'College 3rd Year', 'College 4th Year', 'Graduated');

-- CreateEnum
CREATE TYPE "token_type" AS ENUM ('password_reset', 'email_verification', 'account_recovery');

-- CreateEnum
CREATE TYPE "otp_type" AS ENUM ('email_verification', 'phone_verification', 'login', 'two_factor');

-- CreateEnum
CREATE TYPE "branch" AS ENUM ('Chemical', 'Civil', 'Mechanical', 'Electrical', 'ECE', 'CS/IT');

-- CreateEnum
CREATE TYPE "upload_status" AS ENUM ('pending', 'uploading', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "grade_category" AS ENUM ('Distinction', 'First Class', 'Pass', 'Fail');

-- CreateEnum
CREATE TYPE "cert_grade" AS ENUM ('Distinction', 'First Class', 'Pass');

-- CreateEnum
CREATE TYPE "referral_status" AS ENUM ('pending', 'completed');

-- CreateEnum
CREATE TYPE "withdrawal_status" AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('course_purchase', 'referral_credit', 'withdrawal', 'refund', 'manual_credit', 'manual_debit');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('fixed', 'percentage');

-- CreateEnum
CREATE TYPE "delivery_method" AS ENUM ('in_app', 'email', 'both');

-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "webhook_status" AS ENUM ('success', 'failed', 'ignored');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" TEXT,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20),
    "dob" DATE,
    "study_level" "study_level",
    "avatar_url" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'student',
    "referral_code" VARCHAR(30),
    "referral_code_active" BOOLEAN NOT NULL DEFAULT true,
    "referred_by" TEXT,
    "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "upi_id" VARCHAR(100),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "provider_id" VARCHAR(50) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("provider_id","provider_user_id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_type" "token_type" NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "otp_hash" TEXT NOT NULL,
    "otp_type" "otp_type" NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'reviewer',
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "course_name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "affiliated_branch" "branch" NOT NULL,
    "course_price" DECIMAL(10,2) NOT NULL DEFAULT 299.00,
    "course_thumbnail" TEXT NOT NULL,
    "course_description" TEXT NOT NULL,
    "course_transcript_url" TEXT,
    "problem_statement_text" TEXT NOT NULL,
    "problem_statement_pdf_url" TEXT,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content_text" TEXT NOT NULL,
    "notes_pdf_url" TEXT,
    "quiz_questions" JSONB NOT NULL,
    "is_free_preview" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_assets" (
    "id" TEXT NOT NULL,
    "course_module_id" TEXT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "r2_bucket" VARCHAR(100) NOT NULL DEFAULT 'sprintern-videos',
    "cdn_url" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "duration_seconds" INTEGER,
    "resolution" VARCHAR(20),
    "upload_status" "upload_status" NOT NULL DEFAULT 'pending',
    "processing_status" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'pending',
    "payment_gateway_order_id" VARCHAR(100),
    "payment_gateway_payment_id" VARCHAR(100),
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "promocode_used" VARCHAR(50),
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "payment_metadata" JSONB,
    "current_day" INTEGER NOT NULL DEFAULT 1,
    "day_7_completed" BOOLEAN NOT NULL DEFAULT false,
    "project_submission_deadline" TIMESTAMPTZ,
    "certificate_issued" BOOLEAN NOT NULL DEFAULT false,
    "certificate_id" VARCHAR(100),
    "certificate_url" TEXT,
    "is_admin_granted" BOOLEAN NOT NULL DEFAULT false,
    "admin_granted_by" TEXT,
    "admin_grant_reason" TEXT,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_progress" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT true,
    "unlocked_at" TIMESTAMPTZ,
    "quiz_attempted" BOOLEAN NOT NULL DEFAULT false,
    "quiz_score" INTEGER NOT NULL DEFAULT 0,
    "quiz_answers" JSONB,
    "quiz_passed" BOOLEAN NOT NULL DEFAULT false,
    "quiz_attempts" INTEGER NOT NULL DEFAULT 0,
    "quiz_cooldown_until" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "daily_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_asset_id" TEXT,
    "enrollment_id" TEXT NOT NULL,
    "watch_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "last_position_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_watched_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_file_url" TEXT NOT NULL,
    "report_pdf_url" TEXT NOT NULL,
    "review_status" "review_status" NOT NULL DEFAULT 'pending',
    "assigned_admin_id" TEXT,
    "metric_1_simulation_accuracy" DECIMAL(2,1),
    "metric_2_logic_methodology" DECIMAL(2,1),
    "metric_3_industrial_output" DECIMAL(2,1),
    "metric_4_sensitivity_analysis" DECIMAL(2,1),
    "metric_5_documentation" DECIMAL(2,1),
    "final_grade" DECIMAL(3,2),
    "grade_category" "grade_category",
    "admin_notes" TEXT,
    "resubmission_count" INTEGER NOT NULL DEFAULT 0,
    "max_resubmissions" INTEGER NOT NULL DEFAULT 2,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_started_at" TIMESTAMPTZ,
    "review_completed_at" TIMESTAMPTZ,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_versions" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "project_file_url" TEXT NOT NULL,
    "report_pdf_url" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "submission_id" TEXT,
    "full_name" VARCHAR(200) NOT NULL,
    "college_name" VARCHAR(300) NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "branch" VARCHAR(50) NOT NULL,
    "college_id_url" TEXT NOT NULL,
    "verification_status" "verification_status" NOT NULL DEFAULT 'pending',
    "verified_by" TEXT,
    "admin_notes" TEXT,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificate_id" VARCHAR(100) NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_name" VARCHAR(200) NOT NULL,
    "college_name" VARCHAR(300) NOT NULL,
    "course_name" VARCHAR(200) NOT NULL,
    "grade" "cert_grade" NOT NULL,
    "certificate_url" TEXT NOT NULL,
    "qr_code_data" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by" TEXT,
    "revocation_reason" TEXT,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_verifications" (
    "id" TEXT NOT NULL,
    "certificate_id" VARCHAR(100) NOT NULL,
    "scanned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "certificate_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "referral_code_used" VARCHAR(30) NOT NULL,
    "status" "referral_status" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_completed_at" TIMESTAMPTZ,
    "withdrawal_eligible_at" TIMESTAMPTZ,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "upi_id" VARCHAR(100) NOT NULL,
    "status" "withdrawal_status" NOT NULL DEFAULT 'pending',
    "admin_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "processed_by" TEXT,
    "transaction_id" VARCHAR(100),
    "screenshot_url" TEXT,
    "rejection_reason" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_type" "transaction_type" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50),
    "enrollment_id" TEXT,
    "referral_id" TEXT,
    "withdrawal_request_id" TEXT,
    "gateway_transaction_id" VARCHAR(100),
    "gateway_status" VARCHAR(50),
    "status" "transaction_status" NOT NULL DEFAULT 'pending',
    "admin_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocodes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "promocodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocode_usage" (
    "id" TEXT NOT NULL,
    "promocode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "discount_applied" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promocode_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_campaigns" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "cta_text" VARCHAR(100),
    "cta_link" TEXT,
    "recipient_filter" JSONB NOT NULL DEFAULT '{"type": "all"}',
    "delivery_method" "delivery_method" NOT NULL DEFAULT 'in_app',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "status" "campaign_status" NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "template_key" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "webhook_type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "webhook_status" NOT NULL,
    "error_message" TEXT,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "new_users" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "new_enrollments" INTEGER NOT NULL DEFAULT 0,
    "completed_enrollments" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "refunds" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "net_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "new_referrals" INTEGER NOT NULL DEFAULT 0,
    "referral_conversions" INTEGER NOT NULL DEFAULT 0,
    "referral_payouts" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "videos_watched" INTEGER NOT NULL DEFAULT 0,
    "quizzes_attempted" INTEGER NOT NULL DEFAULT 0,
    "projects_submitted" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_courses" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "enrollments" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "avg_quiz_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "avg_project_grade" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_criteria" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "metric_number" INTEGER NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_description" TEXT,
    "weight_percentage" DECIMAL(5,2) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grading_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_referred_by_idx" ON "users"("referred_by");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_study_level_idx" ON "users"("study_level");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens"("user_id");

-- CreateIndex
CREATE INDEX "auth_tokens_token_type_idx" ON "auth_tokens"("token_type");

-- CreateIndex
CREATE INDEX "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "otp_verifications_email_otp_type_idx" ON "otp_verifications"("email", "otp_type");

-- CreateIndex
CREATE INDEX "otp_verifications_phone_otp_type_idx" ON "otp_verifications"("phone", "otp_type");

-- CreateIndex
CREATE INDEX "otp_verifications_expires_at_idx" ON "otp_verifications"("expires_at");

-- CreateIndex
CREATE INDEX "otp_verifications_user_id_idx" ON "otp_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_username_idx" ON "admins"("username");

-- CreateIndex
CREATE INDEX "admins_is_active_idx" ON "admins"("is_active");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_id_key" ON "courses"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_course_id_idx" ON "courses"("course_id");

-- CreateIndex
CREATE INDEX "courses_affiliated_branch_idx" ON "courses"("affiliated_branch");

-- CreateIndex
CREATE INDEX "courses_is_active_idx" ON "courses"("is_active");

-- CreateIndex
CREATE INDEX "courses_deleted_at_idx" ON "courses"("deleted_at");

-- CreateIndex
CREATE INDEX "course_modules_course_id_idx" ON "course_modules"("course_id");

-- CreateIndex
CREATE INDEX "course_modules_is_free_preview_idx" ON "course_modules"("is_free_preview");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_day_number_key" ON "course_modules"("course_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "video_assets_r2_key_key" ON "video_assets"("r2_key");

-- CreateIndex
CREATE INDEX "video_assets_course_module_id_idx" ON "video_assets"("course_module_id");

-- CreateIndex
CREATE INDEX "video_assets_upload_status_idx" ON "video_assets"("upload_status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_payment_gateway_order_id_key" ON "enrollments"("payment_gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_certificate_id_key" ON "enrollments"("certificate_id");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_course_id_idx" ON "enrollments"("course_id");

-- CreateIndex
CREATE INDEX "enrollments_payment_status_idx" ON "enrollments"("payment_status");

-- CreateIndex
CREATE INDEX "enrollments_certificate_id_idx" ON "enrollments"("certificate_id");

-- CreateIndex
CREATE INDEX "enrollments_deleted_at_idx" ON "enrollments"("deleted_at");

-- CreateIndex
CREATE INDEX "enrollments_is_admin_granted_idx" ON "enrollments"("is_admin_granted");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "daily_progress_enrollment_id_idx" ON "daily_progress"("enrollment_id");

-- CreateIndex
CREATE INDEX "daily_progress_is_locked_idx" ON "daily_progress"("is_locked");

-- CreateIndex
CREATE UNIQUE INDEX "daily_progress_enrollment_id_day_number_key" ON "daily_progress"("enrollment_id", "day_number");

-- CreateIndex
CREATE INDEX "video_views_user_id_idx" ON "video_views"("user_id");

-- CreateIndex
CREATE INDEX "video_views_video_asset_id_idx" ON "video_views"("video_asset_id");

-- CreateIndex
CREATE INDEX "video_views_enrollment_id_idx" ON "video_views"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_views_user_id_video_asset_id_enrollment_id_key" ON "video_views"("user_id", "video_asset_id", "enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_enrollment_id_key" ON "submissions"("enrollment_id");

-- CreateIndex
CREATE INDEX "submissions_enrollment_id_idx" ON "submissions"("enrollment_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_idx" ON "submissions"("user_id");

-- CreateIndex
CREATE INDEX "submissions_review_status_idx" ON "submissions"("review_status");

-- CreateIndex
CREATE INDEX "submissions_assigned_admin_id_idx" ON "submissions"("assigned_admin_id");

-- CreateIndex
CREATE INDEX "submission_versions_submission_id_idx" ON "submission_versions"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_versions_submission_id_version_number_key" ON "submission_versions"("submission_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_enrollment_id_key" ON "identity_verifications"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_submission_id_key" ON "identity_verifications"("submission_id");

-- CreateIndex
CREATE INDEX "identity_verifications_user_id_idx" ON "identity_verifications"("user_id");

-- CreateIndex
CREATE INDEX "identity_verifications_enrollment_id_idx" ON "identity_verifications"("enrollment_id");

-- CreateIndex
CREATE INDEX "identity_verifications_verification_status_idx" ON "identity_verifications"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_enrollment_id_key" ON "certificates"("enrollment_id");

-- CreateIndex
CREATE INDEX "certificates_certificate_id_idx" ON "certificates"("certificate_id");

-- CreateIndex
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");

-- CreateIndex
CREATE INDEX "certificates_course_id_idx" ON "certificates"("course_id");

-- CreateIndex
CREATE INDEX "certificates_is_revoked_idx" ON "certificates"("is_revoked");

-- CreateIndex
CREATE INDEX "certificate_verifications_certificate_id_idx" ON "certificate_verifications"("certificate_id");

-- CreateIndex
CREATE INDEX "certificate_verifications_scanned_at_idx" ON "certificate_verifications"("scanned_at");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "referrals_referee_id_idx" ON "referrals"("referee_id");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "referrals_referral_code_used_idx" ON "referrals"("referral_code_used");

-- CreateIndex
CREATE INDEX "referrals_withdrawal_eligible_at_idx" ON "referrals"("withdrawal_eligible_at");

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_idx" ON "withdrawal_requests"("user_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "transactions_enrollment_id_idx" ON "transactions"("enrollment_id");

-- CreateIndex
CREATE INDEX "transactions_gateway_transaction_id_idx" ON "transactions"("gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "promocodes_code_key" ON "promocodes"("code");

-- CreateIndex
CREATE INDEX "promocodes_code_idx" ON "promocodes"("code");

-- CreateIndex
CREATE INDEX "promocodes_is_active_idx" ON "promocodes"("is_active");

-- CreateIndex
CREATE INDEX "promocodes_valid_from_valid_until_idx" ON "promocodes"("valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "promocode_usage_user_id_idx" ON "promocode_usage"("user_id");

-- CreateIndex
CREATE INDEX "promocode_usage_promocode_id_idx" ON "promocode_usage"("promocode_id");

-- CreateIndex
CREATE INDEX "promocode_usage_user_id_promocode_id_idx" ON "promocode_usage"("user_id", "promocode_id");

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_idx" ON "admin_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_logs_timestamp_idx" ON "admin_logs"("timestamp");

-- CreateIndex
CREATE INDEX "admin_logs_entity_type_entity_id_idx" ON "admin_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_campaign_id_idx" ON "notifications"("campaign_id");

-- CreateIndex
CREATE INDEX "notification_campaigns_status_idx" ON "notification_campaigns"("status");

-- CreateIndex
CREATE INDEX "notification_campaigns_scheduled_at_idx" ON "notification_campaigns"("scheduled_at");

-- CreateIndex
CREATE INDEX "notification_campaigns_created_by_idx" ON "notification_campaigns"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_template_key_key" ON "email_templates"("template_key");

-- CreateIndex
CREATE INDEX "email_templates_template_key_idx" ON "email_templates"("template_key");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "system_settings_setting_key_idx" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "webhook_logs_webhook_type_status_idx" ON "webhook_logs"("webhook_type", "status");

-- CreateIndex
CREATE INDEX "webhook_logs_processed_at_idx" ON "webhook_logs"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_date_key" ON "analytics_daily"("date");

-- CreateIndex
CREATE INDEX "analytics_daily_date_idx" ON "analytics_daily"("date");

-- CreateIndex
CREATE INDEX "analytics_courses_course_id_idx" ON "analytics_courses"("course_id");

-- CreateIndex
CREATE INDEX "analytics_courses_date_idx" ON "analytics_courses"("date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_courses_course_id_date_key" ON "analytics_courses"("course_id", "date");

-- CreateIndex
CREATE INDEX "grading_criteria_course_id_idx" ON "grading_criteria"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_criteria_course_id_metric_number_key" ON "grading_criteria"("course_id", "metric_number");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_assets" ADD CONSTRAINT "video_assets_course_module_id_fkey" FOREIGN KEY ("course_module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_admin_granted_by_fkey" FOREIGN KEY ("admin_granted_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_video_asset_id_fkey" FOREIGN KEY ("video_asset_id") REFERENCES "video_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_versions" ADD CONSTRAINT "submission_versions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("certificate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_withdrawal_request_id_fkey" FOREIGN KEY ("withdrawal_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocodes" ADD CONSTRAINT "promocodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocode_usage" ADD CONSTRAINT "promocode_usage_promocode_id_fkey" FOREIGN KEY ("promocode_id") REFERENCES "promocodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocode_usage" ADD CONSTRAINT "promocode_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocode_usage" ADD CONSTRAINT "promocode_usage_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_campaigns" ADD CONSTRAINT "notification_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_courses" ADD CONSTRAINT "analytics_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_criteria" ADD CONSTRAINT "grading_criteria_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
