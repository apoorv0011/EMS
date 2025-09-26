/*
# [Migration] Definitive Fix for User Sign-Up Automation
This migration provides a final, robust fix for the user sign-up process. It replaces the existing database trigger and function with a new, defensive version that correctly creates user profiles and vendor entries automatically, preventing transaction rollbacks on sign-up.

## Query Description:
- **Idempotent Cleanup**: The script first safely DROPS the existing trigger and function to prevent any conflicts from previous, partially failed migrations.
- **Robust Function Logic**: It re-creates the `handle_new_user` function. This function now uses COALESCE to provide default values, preventing any NULL constraint violations. It correctly inserts a record into the `profiles` table for every new user. If the user's role is 'vendor', it also creates a corresponding record in the `vendors` table.
- **Security Best Practices**: The function is created with `SECURITY DEFINER` and a fixed `search_path`, which are essential for it to operate correctly and securely within Supabase's environment.
- **Trigger Re-creation**: The script re-creates the trigger on the `auth.users` table, ensuring the `handle_new_user` function is executed automatically every time a new user signs up.

This change completely automates the user creation process, so you no longer need to create users or set metadata manually in the Supabase dashboard.
*/

-- Step 1: Safely drop the existing trigger and function to ensure a clean slate.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the new, hyper-robust function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract metadata with defaults to prevent NULL issues
  user_role := COALESCE(NEW.raw_user_meta_data-&gt;&gt;'role', 'user');
  user_full_name := COALESCE(NEW.raw_user_meta_data-&gt;&gt;'full_name', 'New User');

  -- Create a profile for every new user.
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    NEW.raw_user_meta_data-&gt;&gt;'phone', -- Phone can be nullable
    user_role::user_role -- Cast to the ENUM type
  );

  -- If the user signed up as a vendor, create a corresponding vendor entry.
  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, is_approved)
    VALUES (
      NEW.id,
      user_full_name || '''s Store', -- Create a non-null business name
      false -- Vendors must always be approved by an admin.
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Re-create the trigger on the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
