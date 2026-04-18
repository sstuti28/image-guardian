
-- Create a public storage bucket for temporary scan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-uploads', 'scan-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Anyone can read (public bucket — needed so SerpApi can fetch the URL)
CREATE POLICY "Public read scan-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'scan-uploads');
