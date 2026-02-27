-- CreateEnum
CREATE TYPE "AdminIncidentStatus" AS ENUM ('NEW', 'ACK', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AdminIncidentPriority" AS ENUM ('P1', 'P2', 'P3');

-- CreateTable
CREATE TABLE "admin_alert_incidents" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" "AdminIncidentPriority" NOT NULL DEFAULT 'P2',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "user_id" TEXT,
    "session_id" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "status" "AdminIncidentStatus" NOT NULL DEFAULT 'NEW',
    "owner_id" TEXT,
    "due_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_alert_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_incident_activities" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_incident_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_saved_views" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_alert_incidents_fingerprint_key" ON "admin_alert_incidents"("fingerprint");

-- CreateIndex
CREATE INDEX "admin_alert_incidents_status_priority_last_seen_at_idx" ON "admin_alert_incidents"("status", "priority", "last_seen_at");

-- CreateIndex
CREATE INDEX "admin_alert_incidents_owner_id_status_idx" ON "admin_alert_incidents"("owner_id", "status");

-- CreateIndex
CREATE INDEX "admin_alert_incidents_session_id_status_idx" ON "admin_alert_incidents"("session_id", "status");

-- CreateIndex
CREATE INDEX "admin_alert_incidents_user_id_status_idx" ON "admin_alert_incidents"("user_id", "status");

-- CreateIndex
CREATE INDEX "admin_incident_activities_incident_id_created_at_idx" ON "admin_incident_activities"("incident_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_incident_activities_actor_id_created_at_idx" ON "admin_incident_activities"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_saved_views_admin_user_id_page_key_idx" ON "admin_saved_views"("admin_user_id", "page_key");

-- CreateIndex
CREATE INDEX "admin_saved_views_admin_user_id_is_default_idx" ON "admin_saved_views"("admin_user_id", "is_default");

-- AddForeignKey
ALTER TABLE "admin_incident_activities" ADD CONSTRAINT "admin_incident_activities_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "admin_alert_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
