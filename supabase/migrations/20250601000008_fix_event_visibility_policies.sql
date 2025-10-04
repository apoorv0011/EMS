/*
          # [Operation Name]
          Reset RLS Policies for Events and Profiles

          ## Query Description: [This script will completely reset the Row Level Security (RLS) policies for the `events` and `profiles` tables. It drops all existing policies and creates a new, simplified set to ensure correct data visibility and access control. This is a safe operation that only affects security rules, not the data itself. It fixes the critical bug where newly created events were not visible.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables affected: `events`, `profiles`
          - Operations: `DROP POLICY`, `CREATE POLICY`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This script corrects policies to align with the application's authentication logic.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. RLS policy evaluation is highly optimized.
          */

-- Drop all existing policies on events and profiles to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
DROP POLICY IF EXISTS "Allow vendors to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow vendors to update their own events" ON public.events;
DROP POLICY IF EXISTS "Allow vendors to delete their own events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;


-- === EVENTS TABLE POLICIES ===

-- 1. Allow public, unauthenticated read access to all events.
-- This is crucial for the /events page and for the .select() after an insert to work correctly.
CREATE POLICY "Allow public read access to events"
ON public.events
FOR SELECT
USING (true);

-- 2. Allow authenticated vendors to insert events for themselves.
CREATE POLICY "Allow vendors to insert events"
ON public.events
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'vendor'
  AND vendor_id = auth.uid()
);

-- 3. Allow vendors to update their own events.
CREATE POLICY "Allow vendors to update their own events"
ON public.events
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'vendor'
  AND vendor_id = auth.uid()
)
WITH CHECK (
  vendor_id = auth.uid()
);

-- 4. Allow vendors to delete their own events.
CREATE POLICY "Allow vendors to delete their own events"
ON public.events
FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'vendor'
  AND vendor_id = auth.uid()
);


-- === PROFILES TABLE POLICIES ===

-- 1. Allow public read access to all profiles.
-- This is necessary for fetching vendor business names on the public /events page.
CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- 2. Allow users to update their own profile.
CREATE POLICY "Allow users to manage their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow admins to see all profiles (redundant with public read, but good for clarity).
CREATE POLICY "Admins can see all profiles"
ON public.profiles
FOR SELECT
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
