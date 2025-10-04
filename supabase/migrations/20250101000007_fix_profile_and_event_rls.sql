--
-- [Fix Profile and Event RLS Policies]
-- Description: This migration drops all previous, potentially conflicting RLS policies on the 'profiles' and 'events' tables and replaces them with a definitive, correct set. This is a critical fix to resolve event visibility issues.
--
-- Query Description:
-- This operation is non-destructive to your data but will fundamentally change access control rules.
-- 1. It makes all user profiles (including full names and business names) publicly readable. This is necessary for features like showing the vendor's name next to an event.
-- 2. It ensures vendors can only create, update, or delete their own events.
-- 3. It ensures all events are publicly readable.
-- This is a safe but important structural change to your application's security model.
--
-- Metadata:
--   - Schema-Category: "Structural"
--   - Impact-Level: "Medium"
--   - Requires-Backup: false
--   - Reversible: true (by restoring previous policies)
--
-- Structure Details:
--   - Tables affected: `public.profiles`, `public.events`
--
-- Security Implications:
--   - RLS Status: Enabled
--   - Policy Changes: Yes. Policies for SELECT, INSERT, UPDATE on `profiles` and `events` are being replaced.
--   - Auth Requirements: Policies correctly reference `auth.uid()`.
--
-- Performance Impact:
--   - Indexes: None
--   - Triggers: None
--   - Estimated Impact: Low. RLS policy evaluation has a negligible performance impact.
--

-- Drop all existing policies on profiles and events to prevent conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;


DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;
DROP POLICY IF EXISTS "Vendors can insert their own events." ON public.events;
DROP POLICY IF EXISTS "Vendors can update their own events." ON public.events;
DROP POLICY IF EXISTS "Vendors can delete their own events." ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;


-- === PROFILES TABLE POLICIES ===
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to all profiles.
-- This is necessary to show vendor business names on the public events page.
CREATE POLICY "Profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- 2. Users can create their own profile.
-- The `handle_new_user` trigger runs as a superuser, but this is good practice.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- === EVENTS TABLE POLICIES ===
-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to all events.
CREATE POLICY "Events are viewable by everyone."
ON public.events FOR SELECT
USING (true);

-- 2. Vendors can create events for themselves.
CREATE POLICY "Vendors can insert their own events."
ON public.events FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- 3. Vendors can update their own events.
CREATE POLICY "Vendors can update their own events."
ON public.events FOR UPDATE
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- 4. Vendors can delete their own events.
CREATE POLICY "Vendors can delete their own events."
ON public.events FOR DELETE
USING (auth.uid() = vendor_id);
