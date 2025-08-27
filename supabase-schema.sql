-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS custody_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  saturday BOOLEAN DEFAULT false,
  sunday BOOLEAN DEFAULT false,
  pickup_time TIME NOT NULL,
  reminder_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activities TEXT[] NOT NULL,
  custom_activities TEXT[] DEFAULT '{}',
  special_events TEXT[] DEFAULT '{}',
  meals INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS entry_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  google_user_id TEXT NOT NULL,
  google_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custody_schedules_user_id ON custody_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_entry_photos_entry_id ON entry_photos(entry_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE custody_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Custody schedules: users can only access their own schedules
CREATE POLICY "Users can view own custody schedule" ON custody_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custody schedule" ON custody_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custody schedule" ON custody_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custody schedule" ON custody_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Daily entries: users can only access their own entries
CREATE POLICY "Users can view own daily entries" ON daily_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily entries" ON daily_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily entries" ON daily_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Entry photos: users can only access photos from their own entries
CREATE POLICY "Users can view own entry photos" ON entry_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = entry_photos.entry_id 
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own entry photos" ON entry_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = entry_photos.entry_id 
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own entry photos" ON entry_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = entry_photos.entry_id 
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own entry photos" ON entry_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = entry_photos.entry_id 
      AND daily_entries.user_id = auth.uid()
    )
  );

-- Google OAuth tokens: users can only access their own tokens
CREATE POLICY "Users can view own Google OAuth tokens" ON google_oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google OAuth tokens" ON google_oauth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google OAuth tokens" ON google_oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google OAuth tokens" ON google_oauth_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for custody photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('custody-photos', 'custody-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custody photos
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'custody-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'custody-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'custody-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'custody-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_custody_schedules_updated_at 
  BEFORE UPDATE ON custody_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at 
  BEFORE UPDATE ON daily_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_oauth_tokens_updated_at 
  BEFORE UPDATE ON google_oauth_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
