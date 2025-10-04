/*
# [Fix] Resolve Infinite Recursion in Profile RLS Policy

This migration fixes a critical "infinite recursion" error in the Row Level Security (RLS) policy for the `profiles` table. The previous policy was causing queries to fail by calling itself in a loop. This script replaces the faulty policies with a secure and correct implementation using a `SECURITY DEFINER` function, which is the standard practice for this scenario.

## Query Description:
This operation is safe and non-destructive to your data. It modifies the security rules that govern access to the `profiles` table.
1.  It creates a helper function `get_current_user_role()` to safely retrieve the current user's role.
2.  It drops all existing policies on the `profiles` table to ensure a clean state.
3.  It creates a new, correct set of policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.

After applying this migration, the application will be able to fetch user profiles correctly, resolving the login and data display issues.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Functions Created:** `get_current_user_role()`
- **Policies Modified:** All policies on the `public.profiles` table will be replaced.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This fixes a major flaw in the RLS implementation, making it more secure and functional.
- Auth Requirements: Policies rely on `auth.uid()`.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The new function is marked as `STABLE` for better performance.
*/

-- Step 1: Create a helper function to get the role of the currently authenticated user.
-- The `SECURITY DEFINER` clause is crucial. It makes the function execute with the
-- permissions of the user who defined it, which bypasses the RLS policy on the
-- `profiles` table for this specific check, preventing infinite recursion.
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE -- Ensures the function is only called once per query for the same input
-- Set a specific search path to avoid security issues
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- Step 2: Drop all existing policies on the `profiles` table to ensure a clean state.
-- This is important to remove any lingering, conflicting, or faulty policies from previous attempts.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile, and admins can view all." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Deletes are forbidden" ON public.profiles;


-- Step 3: Recreate the policies using the new, safe helper function.

-- SELECT Policy:
-- A user can view their own profile.
-- An admin can view any profile.
CREATE POLICY "Users can view own profile, admins can view all" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR get_current_user_role() = 'admin'
);

-- INSERT Policy:
-- A user can insert their own profile record.
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE Policy:
-- A user can update their own profile record.
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE Policy:
-- No one is allowed to delete profiles via the API to prevent accidental data loss.
CREATE POLICY "Deletes are forbidden" ON public.profiles
FOR DELETE
USING (false);
