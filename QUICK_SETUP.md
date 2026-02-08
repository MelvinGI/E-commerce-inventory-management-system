# Quick Setup Guide - Complete System

## Prerequisites
- Supabase project created
- Database connected
- Admin and supplier users created

---

## Step 1: Database Setup (SQL Editor)

### A. Procurement System
```sql
-- Run: scripts/035_create_procurement_system.sql
```
✅ Creates procurement_orders table
✅ Sets up RLS policies
✅ Configures auto-generated order numbers

### B. Storage Bucket
```sql
-- Run: scripts/036_create_storage_bucket.sql
```
✅ Creates products storage bucket
✅ Configures file size and type limits

---

## Step 2: Storage Policies (Dashboard)

**Go to**: Storage → products → Policies

Create these 4 policies:

### Policy 1: Public Read
```
Name: Public can view product images
Operation: SELECT
Definition: bucket_id = 'products'
```

### Policy 2: Upload
```
Name: Authenticated users can upload product images
Operation: INSERT
Target: authenticated
WITH CHECK: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 3: Update
```
Name: Users can update their own product images
Operation: UPDATE
Target: authenticated
USING: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
WITH CHECK: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 4: Delete
```
Name: Users can delete their own product images
Operation: DELETE
Target: authenticated
USING: bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
```

**Detailed instructions**: See `STORAGE_SETUP_GUIDE.md`

---

## Step 3: Verify Setup

### Check Database
```sql
-- Verify procurement_orders table exists
SELECT * FROM procurement_orders LIMIT 1;

-- Verify storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'products';
```

### Check Dashboard
- ✅ Storage → products bucket exists
- ✅ Bucket is marked "Public"
- ✅ 4 policies are active

---

## Step 4: Test the System

### Test 1: Procurement Workflow
1. Login as **admin**
2. Dashboard → Stock → Create Procurement Order
3. Select supplier, fill details, submit
4. Login as **supplier**
5. Check notification bell (should show 1)
6. Dashboard → Stock → Update Status → "In Transit"
7. Update Status → "Delivered"
8. Login as **admin**
9. Check notification bell (should show 1)
10. Dashboard → Stock → Mark Received
✅ Complete workflow tested

### Test 2: Image Upload
1. Login as **admin**
2. Dashboard → Products → Add Product
3. Fill details, upload image (< 5MB)
4. Save product
5. Verify image appears in products table
6. Go to Store → Products
7. Verify image displays on product card
✅ Image upload tested

### Test 3: Notifications
1. Login as **admin**
2. Create procurement order
3. Login as **supplier**
4. Check bell icon (should have badge)
5. Click bell, see notification
6. Click notification, goes to Stock page
✅ Notifications tested

### Test 4: Analytics
1. Login as **admin** or **supplier**
2. Dashboard → Analytics
3. Verify procurement overview displays
4. Check spending trend chart
5. Verify completion rate calculates
✅ Analytics tested

---

## Common Issues & Fixes

### Issue: "Bucket already exists"
**Fix**: This is fine! Skip to Step 2.

### Issue: Images not uploading
**Fix**: 
1. Check all 4 storage policies are created
2. Verify bucket is public
3. Check file is < 5MB and valid image type

### Issue: Notifications not showing
**Fix**:
1. Check procurement orders exist
2. Verify user roles are correct
3. Wait 30 seconds for auto-refresh

### Issue: Supplier can't see orders
**Fix**:
1. Check RLS policies on procurement_orders
2. Verify supplier_id matches user ID
3. Check user role is "supplier"

---

## Quick Verification Checklist

### Database ✅
- [ ] procurement_orders table exists
- [ ] products bucket exists
- [ ] RLS policies active

### Storage ✅
- [ ] Bucket is public
- [ ] 4 policies configured
- [ ] File limits set (5MB)

### Features ✅
- [ ] Procurement workflow works
- [ ] Images upload successfully
- [ ] Notifications appear
- [ ] Analytics display data
- [ ] Role-based access works

---

## Need Help?

### Detailed Guides:
- **Storage Setup**: `STORAGE_SETUP_GUIDE.md`
- **Procurement**: `PROCUREMENT_SETUP.md`
- **Images**: `PRODUCT_IMAGE_UPLOAD.md`
- **Complete System**: `FINAL_IMPLEMENTATION_SUMMARY.md`

### Test Accounts Needed:
- 1 Admin account
- 1 Supplier account
- 1 Customer account (optional)

---

## System Ready! 🎉

Once all checks pass, your system is fully operational:
- ✅ Procurement management
- ✅ Real-time notifications
- ✅ Product images
- ✅ Analytics & reporting
- ✅ Role-based access

**Estimated Setup Time**: 10-15 minutes
