/*
# [Operation Name]
Correct RLS Policies and Schema Constraints

## Query Description: This migration corrects several issues in the database. It drops all old, potentially incorrect security policies on the 'profiles' and 'events' tables and replaces them with a secure and functional set. It also adds a cascading delete to the 'order_items' table, ensuring that when an event is deleted, all associated order line items are also removed automatically. This prevents orphaned data and fixes errors when vendors try to delete events that have been purchased.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops and recreates all RLS policies on 'public.profiles' and 'public.events'.
- Creates a helper function 'get_user_role'.
- Alters 'public.order_items' to add a cascading delete constraint.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies are based on authenticated user roles.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The changes are to metadata and policies, which will have minimal performance impact on a small dataset.
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admin can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Vendors can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Vendors can update their own events" ON public.events;
DROP POLICY IF EXISTS "Vendors can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;

-- Drop existing helper function if it exists
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Helper function to get user role from profiles table
-- SECURITY DEFINER allows this function to bypass RLS on the profiles table
-- to check a user's role, which is necessary for other policies.
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- === PROFILES POLICIES ===

-- 1. Users can view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- 2. Authenticated users can view other profiles (needed for vendor names, etc.)
CREATE POLICY "Authenticated users can view other profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );


-- === EVENTS POLICIES ===

-- 1. Anyone can view events.
CREATE POLICY "Anyone can view events"
ON public.events FOR SELECT
USING (true);

-- 2. Vendors can insert events for themselves.
CREATE POLICY "Vendors can insert their own events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'vendor' AND
  vendor_id = auth.uid()
);

-- 3. Vendors can update their own events.
CREATE POLICY "Vendors can update their own events"
ON public.events FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'vendor' AND
  vendor_id = auth.uid()
)
WITH CHECK (
  vendor_id = auth.uid()
);

-- 4. Vendors can delete their own events.
CREATE POLICY "Vendors can delete their own events"
ON public.events FOR DELETE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'vendor' AND
  vendor_id = auth.uid()
);

-- === SCHEMA FIX: Add ON DELETE CASCADE to order_items ===
-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_event_id_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;
