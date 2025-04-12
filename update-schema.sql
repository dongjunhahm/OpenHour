-- Add invitation_token and invitation_status columns to calendar_participants table
ALTER TABLE calendar_participants ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(128);
ALTER TABLE calendar_participants ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(20) DEFAULT 'PENDING';

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_calendar_participants_invitation_token ON calendar_participants(invitation_token);
