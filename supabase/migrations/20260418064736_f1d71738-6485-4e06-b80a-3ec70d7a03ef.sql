
-- Drop the broad read policy and rely on the bucket being public for direct URL access only.
-- Public buckets allow GET on a known object path without RLS; removing the SELECT policy
-- on storage.objects prevents listing while keeping direct URL fetches working.
DROP POLICY IF EXISTS "Public read scan-uploads" ON storage.objects;
