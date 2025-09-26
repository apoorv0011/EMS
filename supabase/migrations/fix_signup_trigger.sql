/*
# [Fix] Correct User & Vendor Creation Trigger
This script resolves the "trigger already exists" error by safely dropping the old trigger and function before creating the corrected versions. It consolidates user profile and vendor creation into a single, reliable database function that executes after a new user is created in `auth.users`.

## Query Description:
This operation will replace the existing user creation trigger. It first removes the old `on_auth_user_created` trigger and its associated `handle_new_user` function. Then, it creates a new, improved function and re-links the trigger. This ensures that when a new user signs up, their profile (and vendor record, if applicable) is created correctly without conflicts. This change is safe and essential for fixing the vendor sign-up issue.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops trigger: `on_auth_user_created` on `auth.users`
- Drops function: `public.handle_new_user()`
- Creates function: `public.handle_new_user()`
- Creates trigger: `on_auth_user_created` on `auth.users`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: The function is run with `security definer` privileges to insert into `public` tables.
- The function's search path is explicitly set to `public` to mitigate the "Function Search Path Mutable" security warning.

## Performance Impact:
- Indexes: None
- Triggers: Replaces one trigger. Minimal impact on user sign-up performance.
- Estimated Impact: Low.
*/

-- Step 1: Drop the existing trigger if it exists to avoid conflict.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the existing function if it exists.
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create the new, consolidated function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'role'
  );

  -- If the user is a vendor, create a vendor entry
  IF new.raw_user_meta_data->>'role' = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, business_description)
    VALUES (
      new.id,
      (new.raw_user_meta_data->>'full_name') || '''s Business', -- Default business name
      'Default business description.' -- Default description
    );
  END IF;

  RETURN new;
END;
$$;

-- Step 4: Re-create the trigger to call the new function.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
