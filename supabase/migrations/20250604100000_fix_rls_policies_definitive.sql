/*
          # [Operation Name]
          Definitive RLS Policy Reset for Events and Profiles

          ## Query Description: [This script performs a full reset of the Row Level Security (RLS) policies for the `events` and `profiles` tables. It removes all old, potentially conflicting policies and creates a new, simplified, and correct set of rules. This will fix the issue where newly created events were not visible. This operation is safe and will not affect any existing data in your tables.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables affected: `public.events`, `public.profiles`
          - Operations: `DROP POLICY`, `CREATE POLICY`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are being redefined to align with application logic.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact. This change corrects data visibility logic.
          */

-- Drop all existing policies on 'events' and 'profiles' to ensure a clean slate.
DROP POLICY IF EXISTS "Events are publicly viewable" ON public.events;
DROP POLICY IF EXISTS "Vendors can create their own events" ON public.events;
DROP POLICY IF EXISTS "Vendors can update their own events" ON public.events;
DROP POLICY IF EXISTS "Vendors can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Vendors can view their own events" ON public.events;
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;


DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;


-- === PROFILES TABLE RLS POLICIES ===

-- 1. Policy: Allow public read access to all profiles.
-- This is necessary so that event details can show the vendor's business name.
CREATE POLICY "Profiles are publicly viewable"
ON public.profiles FOR SELECT
USING (true);

-- 2. Policy: Allow users to update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- === EVENTS TABLE RLS POLICIES ===

-- 1. Policy: Allow public read access to all events.
CREATE POLICY "Events are publicly viewable"
ON public.events FOR SELECT
USING (true);

-- 2. Policy: Allow vendors to insert events for themselves.
-- The CHECK clause ensures the `vendor_id` matches the creator's ID and they have the 'vendor' role.
CREATE POLICY "Vendors can create their own events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vendor_id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'vendor'
);

-- 3. Policy: Allow vendors to update their own events.
CREATE POLICY "Vendors can update their own events"
ON public.events FOR UPDATE
USING (auth.uid() = vendor_id);

-- 4. Policy: Allow vendors to delete their own events.
CREATE POLICY "Vendors can delete their own events"
ON public.events FOR DELETE
USING (auth.uid() = vendor_id);
