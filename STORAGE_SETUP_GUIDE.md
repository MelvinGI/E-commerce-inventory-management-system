# Storage Bucket Setup Guide - Step by Step

## Overview
This guide walks you through setting up the product images storage bucket in Supabase Dashboard.

## Step 1: Run the SQL Script

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `scripts/036_create_storage_bucket.sql`
5. Click **Run**

This creates the storage bucket with the correct configuration.

---

## Step 2: Configure Storage Policies (Manual Setup)

Since storage RLS policies require dashboard configuration, follow these steps:

### A. Navigate to Storage
1. In Supabase Dashboard, click **Storage** in the left sidebar
2. You should see the **products** bucket listed
3. Click on the **products** bucket

### B. Create Policy 1: Public Read Access

1. Click the **Policies** tab
2. Click **New Policy**
3. Choose **Custom** policy
4. Fill in the details:

```
Policy Name: Public can view product images
Allowed operation: SELECT
Policy definition: bucket_id = 'products'
Target roles: Leave empty (applies to all)
```

5. Click **Review** then **Save policy**

### C. Create Policy 2: Authenticated Upload

1. Click **New Policy** again
2. Choose **Custom** policy
3. Fill in the details:

```
Policy Name: Authenticated users can upload product images
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

4. Click **Review** then **Save policy**

### D. Create Policy 3: Update Own Images

1. Click **New Policy** again
2. Choose **Custom** policy
3. Fill in the details:

```
Policy Name: Users can update their own product images
Allowed operation: UPDATE
Target roles: authenticated
USING: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
WITH CHECK: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

4. Click **Review** then **Save policy**

### E. Create Policy 4: Delete Own Images

1. Click **New Policy** again
2. Choose **Custom** policy
3. Fill in the details:

```
Policy Name: Users can delete their own product images
Allowed operation: DELETE
Target roles: authenticated
USING: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

4. Click **Review** then **Save policy**

---

## Step 3: Verify Setup

### Check Bucket Configuration
1. Go to **Storage** > **products**
2. Click **Configuration** tab
3. Verify:
   - ✅ Public bucket: **Yes**
   - ✅ File size limit: **5 MB**
   - ✅ Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

### Check Policies
1. Go to **Storage** > **products** > **Policies**
2. You should see 4 policies:
   - ✅ Public can view product images (SELECT)
   - ✅ Authenticated users can upload product images (INSERT)
   - ✅ Users can update their own product images (UPDATE)
   - ✅ Users can delete their own product images (DELETE)

---

## Step 4: Test the Setup

### Test Upload
1. Login to your app as admin
2. Go to **Dashboard** > **Products**
3. Click **Add Product**
4. Fill in product details
5. Upload an image
6. Save the product
7. Verify image appears in the products table

### Test Public Access
1. Check the image URL in the database
2. Open the URL in a new browser tab (incognito mode)
3. Image should load without authentication

### Test Security
1. Try to upload a file > 5MB (should fail)
2. Try to upload a non-image file (should fail)
3. Try to access another user's folder (should fail)

---

## Alternative: Quick Setup via Dashboard UI

If you prefer not to use SQL, you can create the bucket entirely via the dashboard:

### Create Bucket
1. Go to **Storage**
2. Click **New bucket**
3. Enter details:
   - Name: `products`
   - Public: **Yes**
   - File size limit: `5242880` (5MB in bytes)
   - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp,image/gif`
4. Click **Create bucket**

Then follow Steps 2-4 above to configure policies and test.

---

## Troubleshooting

### Error: "Bucket already exists"
- This is fine! The bucket was created successfully
- Skip to Step 2 to configure policies

### Error: "Permission denied"
- Check that you're logged in as admin
- Verify the user's role in the profiles table
- Check RLS policies are active

### Images not uploading
- Verify all 4 policies are created
- Check file size is under 5MB
- Ensure file is a valid image type
- Check browser console for errors

### Images not displaying
- Verify bucket is set to **Public**
- Check the image URL is correct
- Test URL in incognito browser
- Check CORS settings if needed

---

## Policy Definitions Reference

For copy-paste convenience:

### Policy 1 (SELECT):
```sql
bucket_id = 'products'
```

### Policy 2 (INSERT):
```sql
bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 3 (UPDATE - USING):
```sql
bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 3 (UPDATE - WITH CHECK):
```sql
bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 4 (DELETE):
```sql
bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## Security Notes

### What These Policies Do:

1. **Public Read**: Anyone can view product images (needed for customers)
2. **Authenticated Upload**: Only logged-in users can upload
3. **User Folders**: Users can only upload to folders named with their user ID
4. **Own Files Only**: Users can only update/delete their own images

### Folder Structure:
```
products/
  ├── {user_id_1}/
  │   ├── 1234567890.jpg
  │   └── 1234567891.png
  ├── {user_id_2}/
  │   └── 1234567892.jpg
  └── ...
```

This ensures users cannot access or modify other users' images.

---

## Complete! ✅

Once you've completed all steps:
- ✅ Bucket created
- ✅ 4 policies configured
- ✅ Setup verified
- ✅ Test upload successful

Your product image upload system is ready to use!
