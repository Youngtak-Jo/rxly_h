-- CreateTable
CREATE TABLE "export_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_links_user_id_idx" ON "export_links"("user_id");
