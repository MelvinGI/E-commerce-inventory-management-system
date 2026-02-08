# Product Image Upload Feature

## Overview
Added image upload functionality for products, allowing admins to upload product images that customers can see in the store.

## Features Implemented

### 1. Image Upload in Product Form
- **File Selection**: Browse and select image files
- **File Validation**:
  - Only image files accepted (JPG, PNG, WebP, GIF)
  - Maximum file size: 5MB
  - Real-time validation with user feedback
- **Image Preview**: Shows preview before saving
- **Existing Image Display**: Shows current image when editing

### 2. Supabase Storage Integration
- **Storage Bucket**: Created "products" bucket
- **Organized Storage**: Images stored in user-specific folders
- **Public Access**: Images are publicly accessible via URL
- **Security**: RLS policies ensure users can only manage their own images

### 3. Product Display with Images
- **Dashboard Products Table**: Shows thumbnail images (48x48px)
- **Store Product Cards**: Displays full product images
- **Fallback**: Shows placeholder icon when no image available
- **Responsive**: Images scale properly on all devices

## Database Schema

The `products` table already includes:
```sql
image_url text  -- Stores the public URL of the uploaded image
```

## Storage Setup

### Bucket Configuration
- **Name**: `products`
- **Public**: Yes (images are publicly viewable)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, WebP, GIF

### Storage Structure
```
products/
  └── {user_id}/
      ├── {timestamp1}.jpg
      ├── {timestamp2}.png
      └── ...
```

### RLS Policies
1. **Public Read**: Anyone can view product images
2. **Authenticated Upload**: Only authenticated users can upload
3. **User-Specific**: Users can only upload to their own folder
4. **User Management**: Users can update/delete only their own images

## Setup Instructions

### 1. Run Storage Setup Script
```sql
-- Execute in Supabase SQL Editor
-- File: scripts/036_create_storage_bucket.sql
```

This script will create the "products" storage bucket.

### 2. Configure Storage Policies (Manual)

**Important**: Storage RLS policies must be configured via Supabase Dashboard.

Follow the detailed guide in `STORAGE_SETUP_GUIDE.md` or:

1. Go to Supabase Dashboard → **Storage** → **products** → **Policies**
2. Create 4 policies:
   - Public read access (SELECT)
   - Authenticated upload (INSERT)
   - Update own images (UPDATE)
   - Delete own images (DELETE)

See `STORAGE_SETUP_GUIDE.md` for complete step-by-step instructions.

### 3. Verify Setup
1. Check bucket is marked as "Public"
2. Verify all 4 policies are active
3. Test image upload in the app

## Usage Guide

### For Admins (Adding Products)

1. **Navigate to Products**
   - Go to Dashboard → Products
   - Click "Add Product"

2. **Fill Product Details**
   - Enter name, SKU, price, etc.
   - Scroll to "Product Image" section

3. **Upload Image**
   - Click "Choose File"
   - Select an image (max 5MB)
   - Preview appears immediately
   - Complete the form and save

4. **Edit Product Image**
   - Click edit on any product
   - Current image is displayed
   - Upload new image to replace
   - Or keep existing image

### For Customers (Viewing Products)

1. **Browse Store**
   - Go to Store → Products
   - Product cards show images

2. **Product Display**
   - Large image on product card
   - Fallback text if no image
   - Click "Add to Cart" to purchase

## Technical Details

### Image Upload Flow
1. User selects file
2. Client validates file type and size
3. File is read for preview
4. On form submit:
   - Image uploads to Supabase Storage
   - Public URL is generated
   - URL saved to products table
5. Image displays in product listings

### File Naming Convention
```
{user_id}/{timestamp}.{extension}
```
Example: `abc123-def456/1701234567890.jpg`

### Error Handling
- Invalid file type → Alert user
- File too large → Alert user
- Upload failure → Alert with error message
- Network issues → Graceful error handling

## Files Modified/Created

### Created (1 file):
1. `scripts/036_create_storage_bucket.sql` - Storage bucket setup

### Modified (3 files):
1. `components/products/product-form.tsx` - Added image upload
2. `app/dashboard/products/page.tsx` - Added image column
3. `PRODUCT_IMAGE_UPLOAD.md` - This documentation

## Security Considerations

### Access Control
- ✅ Users can only upload to their own folder
- ✅ Public read access for product images
- ✅ No anonymous uploads
- ✅ File type restrictions enforced
- ✅ File size limits enforced

### Best Practices
- Images stored with unique timestamps
- No overwriting of existing files
- Proper error handling
- User feedback on all actions

## Testing Checklist

### As Admin:
- [ ] Create new product with image
- [ ] Verify image appears in products table
- [ ] Edit product and change image
- [ ] Create product without image (should work)
- [ ] Try uploading file > 5MB (should fail)
- [ ] Try uploading non-image file (should fail)

### As Customer:
- [ ] View products in store
- [ ] See product images on cards
- [ ] Products without images show placeholder
- [ ] Images load properly
- [ ] Add product to cart (image should not affect functionality)

## Troubleshooting

### Image Not Uploading
1. Check Supabase Storage bucket exists
2. Verify RLS policies are active
3. Check browser console for errors
4. Ensure file is under 5MB
5. Verify file is valid image type

### Image Not Displaying
1. Check image_url in database
2. Verify URL is accessible
3. Check bucket is public
4. Verify RLS policies allow public read

### Permission Errors
1. Ensure user is authenticated
2. Check RLS policies
3. Verify user folder structure
4. Check Supabase logs

## Future Enhancements

### Potential Improvements:
1. Multiple images per product
2. Image cropping/editing tool
3. Automatic image optimization
4. Image gallery view
5. Drag-and-drop upload
6. Bulk image upload
7. Image compression before upload
8. CDN integration for faster loading

## Notes
- Images are stored permanently until manually deleted
- Deleting a product does NOT automatically delete its image
- Consider implementing cleanup for orphaned images
- Monitor storage usage in Supabase dashboard
