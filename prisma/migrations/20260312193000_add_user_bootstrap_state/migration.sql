CREATE TABLE "user_bootstrap_states" (
    "user_id" TEXT NOT NULL,
    "sample_sessions_seeded_at" TIMESTAMP(3),
    "sample_pack_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bootstrap_states_pkey" PRIMARY KEY ("user_id")
);
