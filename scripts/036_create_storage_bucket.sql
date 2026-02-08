-- Create storage bucket for product images
-- Note: This creates the bucket. RLS policies must be set via Supabase Dashboard.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage RLS policies cannot be created via SQL in standard Supabase setup.
-- Please configure the following policies manually in the Supabase Dashboard:
-- 
-- Go to: Storage > products bucket > Policies
-- 
-- 1. Policy: "Public can view product images"
--    Operation: SELECT
--    Policy definition: bucket_id = 'products'
--
-- 2. Policy: "Authenticated users can upload product images"
--    Operation: INSERT
--    Target roles: authenticated
--    Policy definition: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 3. Policy: "Users can update their own product images"
--    Operation: UPDATE
--    Target roles: authenticated
--    USING: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
--    WITH CHECK: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- 4. Policy: "Users can delete their own product images"
--    Operation: DELETE
--    Target roles: authenticated
--    Policy definition: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
