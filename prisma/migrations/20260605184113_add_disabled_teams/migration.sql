-- CreateTable
CREATE TABLE "DisabledTeam" (
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisabledTeam_pkey" PRIMARY KEY ("teamId")
);
