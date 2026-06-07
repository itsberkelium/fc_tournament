INSERT INTO "Settings" ("key", "value")
VALUES ('playoffEnabled', 'true'), ('playoffTeamCount', '8')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";
