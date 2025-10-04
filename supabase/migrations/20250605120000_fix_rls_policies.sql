/*
          # [Fix RLS Policies and Foreign Keys]
          This migration script corrects the Row Level Security (RLS) policies for the `profiles` and `events` tables to ensure data is visible and editable correctly based on user roles. It also adds a cascading delete to the `order_items` table to maintain data integrity.

          ## Query Description: [This operation will drop and recreate several security policies. It is a non-destructive change to your data, but it fundamentally alters who can see and modify data.
          1. **Profiles Table:** Allows any logged-in user to view profile information (like names), which is necessary for displaying vendor details on the events page.
          2. **Events Table:** Ensures vendors can create, view, update, and delete their own events, and that all users can see all events on the public listing.
          3. **Order Items Table:** Adds `ON DELETE CASCADE` so that when an event is deleted, all associated order items are also automatically removed.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables affected: `profiles`, `events`, `order_items`
          - Operations: `DROP POLICY`, `CREATE POLICY`, `ALTER TABLE`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on `auth.uid()` and `auth.role()`.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. RLS policy checks have minimal overhead.
          */

-- Drop all existing policies on profiles and events to start fresh
DROP POLICY IF EXISTS "Allow individual read access" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow users to update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow public read access to all events" ON "public"."events";
DROP POLICY IF EXISTS "Allow vendors to insert their own events" ON "public"."events";
DROP POLICY IF EXISTS "Allow vendors to view their own events" ON "public"."events";
DROP POLICY IF EXISTS "Allow vendors to update their own events" ON "public"."events";
DROP POLICY IF EXISTS "Allow vendors to delete their own events" ON "public"."events";

-- ========== PROFILES TABLE POLICIES ==========

-- 1. Allow authenticated users to view all profiles (needed for event/order details)
CREATE POLICY "Allow authenticated users to read profiles" ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON "public"."profiles"
FOR UPDATE
USING ((auth.uid() = id))
WITH CHECK ((auth.uid() = id));


-- ========== EVENTS TABLE POLICIES ==========

-- 1. Allow authenticated users to view all events
CREATE POLICY "Allow authenticated users to view events" ON "public"."events"
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow vendors to insert events for themselves
CREATE POLICY "Allow vendors to insert their own events" ON "public"."events"
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'vendor'
  AND auth.uid() = vendor_id
);

-- 3. Allow vendors to update their own events
CREATE POLICY "Allow vendors to update their own events" ON "public"."events"
FOR UPDATE
USING ((auth.uid() = vendor_id))
WITH CHECK ((auth.uid() = vendor_id));

-- 4. Allow vendors to delete their own events
CREATE POLICY "Allow vendors to delete their own events" ON "public"."events"
FOR DELETE
USING ((auth.uid() = vendor_id));


-- ========== FIX FOREIGN KEY CONSTRAINTS ==========

-- Drop the existing foreign key on order_items
ALTER TABLE "public"."order_items" DROP CONSTRAINT IF EXISTS "order_items_event_id_fkey";

-- Re-create it with ON DELETE CASCADE
ALTER TABLE "public"."order_items"
ADD CONSTRAINT "order_items_event_id_fkey"
FOREIGN KEY (event_id) REFERENCES "public"."events"(id)
ON DELETE CASCADE;
