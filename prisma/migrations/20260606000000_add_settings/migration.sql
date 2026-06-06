-- CreateTable
CREATE TABLE "Settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("key")
);

-- Seed defaults
INSERT INTO "Settings" ("key", "value") VALUES
  ('tournamentName', 'EA FC 26 Ligi'),
  ('registrationLocked', 'false')
ON CONFLICT ("key") DO NOTHING;
