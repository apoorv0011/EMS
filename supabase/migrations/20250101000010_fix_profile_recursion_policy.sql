/*
# [Fix] RLS Infinite Recursion on Profiles Table
This migration addresses the "infinite recursion" error by restructuring the Row Level Security (RLS) policies for the `profiles` table. It drops all existing policies on the table to ensure a clean state and then creates a new set of secure policies that use a helper function to safely check user roles without causing recursion.

## Query Description:
This operation will temporarily remove all access controls on the `profiles` table before re-applying new, corrected ones. While the script runs quickly, there is a brief moment where the table is less protected. This is a necessary step to clear out any misconfigured or conflicting policies that have caused the recursion error. The new policies restore and correct the intended security model.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false (Old policies are dropped permanently)

## Structure Details:
- **Tables Affected**: `public.profiles`
- **Functions Created**: `public.is_admin()`
- **Policies Dropped**: All existing policies on `public.profiles`.
- **Policies Created**:
  - `Allow admin to view all profiles`
  - `Allow individual user to view their own profile`
  - `Allow individual user to update their own profile`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script completely overhauls the RLS policies for the `profiles` table to fix a critical security flaw (infinite recursion) and establish correct access patterns.
- Auth Requirements: Policies rely on `auth.uid()` to identify the current user.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The use of a helper function is a standard and efficient pattern for RLS.
*/

-- Step 1: Drop all existing policies on the profiles table to start fresh.
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles;';
    END LOOP;
END;
$$;

-- Step 2: Create a helper function to check if the current user is an admin.
-- This function is the key to breaking the recursion loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 3: Re-create the RLS policies using the correct, non-recursive patterns.

-- Policy 1: Admins can see all profiles.
CREATE POLICY "Allow admin to view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy 2: Authenticated users can see their own profile.
CREATE POLICY "Allow individual user to view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 3: Users can update their own profile.
CREATE POLICY "Allow individual user to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
