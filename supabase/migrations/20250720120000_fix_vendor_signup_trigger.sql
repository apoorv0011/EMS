/*
          # [Operation Name]
          Fix Vendor Signup Trigger

          ## Query Description: [This migration fixes a bug that prevented users from signing up with the 'vendor' role. It replaces two separate, conflicting database triggers with a single, consolidated trigger. This ensures that user profiles and vendor records are created in the correct order, resolving the "Database error saving new user" error. This change is safe and does not affect existing user data. It also resolves a security warning by setting a secure search_path for the new function.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops triggers: `create_profile_for_new_user`, `create_vendor_for_new_vendor_user` on `auth.users`
          - Drops functions: `public.create_profile_for_new_user()`, `public.create_vendor_for_new_vendor_user()`
          - Creates function: `public.handle_new_user()`
          - Creates trigger: `on_auth_user_created` on `auth.users`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          - Mitigates: "Function Search Path Mutable" warning by setting `search_path` on the new function.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Replaces two triggers with one, potentially minor performance improvement on user creation.
          - Estimated Impact: Negligible performance impact.
          */

-- Step 1: Drop the old triggers from the auth.users table.
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_vendor_for_new_vendor_user ON auth.users;

-- Step 2: Drop the old functions.
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
DROP FUNCTION IF EXISTS public.create_vendor_for_new_vendor_user();

-- Step 3: Create a single new function to handle new user creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user, including their phone number.
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'phone'
  );

  -- If the new user is a vendor, create a corresponding vendor entry.
  IF new.raw_user_meta_data->>'role' = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, contact_email)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name', -- Use full_name as the default business_name
      new.email
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Set the search_path for the new function to enhance security.
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Step 5: Create the new trigger on the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
