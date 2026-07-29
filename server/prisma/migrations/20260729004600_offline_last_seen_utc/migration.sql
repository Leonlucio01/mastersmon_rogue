-- Normalize timestamps created by PostgreSQL local time before offline rewards
-- are used, then require application-provided UTC values for new characters.
UPDATE "Character"
SET "lastSeenAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';

ALTER TABLE "Character"
ALTER COLUMN "lastSeenAt" DROP DEFAULT;
