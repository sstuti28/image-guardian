
-- Authenticated users can upload to scan-uploads
CREATE POLICY "Authenticated can upload scan-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scan-uploads');

-- Authenticated users can delete their uploads (best-effort cleanup)
CREATE POLICY "Authenticated can delete scan-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scan-uploads');
