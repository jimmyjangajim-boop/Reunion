-- Retain loss attribution even when a reported formation has no OOB identity.
ALTER TABLE battle_report_losses ADD COLUMN participant_id TEXT REFERENCES battle_report_participants(id);
