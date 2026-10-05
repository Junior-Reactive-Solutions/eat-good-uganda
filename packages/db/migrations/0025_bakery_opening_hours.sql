-- 0025_bakery_opening_hours
-- Purpose: per-bakery weekly opening hours schedule
-- Safe to re-run: no (uses CREATE TABLE)

-- migrate:up
CREATE TABLE bakery_opening_hours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bakery_id   uuid NOT NULL REFERENCES bakeries(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  opens_at    time NOT NULL,   -- wall-clock time in bakery's own timezone
  closes_at   time NOT NULL,   -- wall-clock time in bakery's own timezone
  is_closed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  bakery_opening_hours_unique_day UNIQUE (bakery_id, day_of_week)
);

CREATE INDEX idx_opening_hours_bakery ON bakery_opening_hours(bakery_id);

-- migrate:down
DROP TABLE IF EXISTS bakery_opening_hours;
