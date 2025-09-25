/*
# [Fix] Idempotent User Creation Trigger v3
This script robustly replaces the user creation trigger and function to resolve the "trigger already exists" error from the previous migration. It explicitly drops the existing objects before recreating them.

## Query Description:
This operation safely updates the database's user creation logic. It ensures that whenever a new user is created in Supabase's `auth.users` table, a corresponding entry is automatically created in the `public.profiles` table and, if the user's role is 'vendor', in the `public.vendors` table. By using `DROP...IF EXISTS`, this script is safe to run and corrects previous migration issues.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the created trigger/function)

## Structure Details:
- Drops function `public.handle_new_user` if it exists.
- Drops trigger `on_auth_user_created` on `auth.users` if it exists.
- Re-creates function `public.handle_new_user`.
- Re-creates trigger `on_auth_user_created` on `auth.users`.

## Security Implications:
- RLS Status: Not changed.
- Policy Changes: No.
- Auth Requirements: Requires security definer to operate on `auth.users` and insert into `public` tables.
- Search Path: Explicitly sets `search_path` to `public` to mitigate security risks.

## Performance Impact:
- Indexes: None.
- Triggers: Replaces one trigger on `auth.users`. Impact is minimal, only occurs on new user creation.
- Estimated Impact: Negligible performance impact.
*/

-- Step 1: Drop the existing trigger on auth.users if it exists.
-- This is the key step to fix the "trigger already exists" error.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the existing function if it exists.
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create the new, corrected function.
-- This function handles creating a profile and a vendor entry if needed.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_vendor_id uuid;
BEGIN
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    (NEW.raw_user_meta_data ->> 'role')::user_role
  );

  -- If the user is a vendor, create a corresponding vendor entry
  IF (NEW.raw_user_meta_data ->> 'role')::user_role = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, business_description)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'full_name') || '''s Store', -- Default business name
      'Welcome to my store on EventHub!' -- Default description
    )
    RETURNING id INTO new_vendor_id;

    -- Update the profile with the new vendor_id
    UPDATE public.profiles
    SET vendor_id = new_vendor_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Re-create the trigger to call the new function after a user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
