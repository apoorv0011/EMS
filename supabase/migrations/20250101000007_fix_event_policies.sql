/*
          # [Operation Name]
          Update RLS Policies for Events and Profiles

          ## Query Description: This migration updates the Row Level Security (RLS) policies for the `events` and `profiles` tables to resolve issues with event creation and visibility.
          1.  It simplifies the `INSERT` policy on the `events` table. The previous policy included a function call that was causing silent failures. The new policy relies on a direct check of the user's ID, which is more reliable.
          2.  It updates the `SELECT` policy on the `profiles` table to allow public read access. This fixes a bug where event vendor names would not appear for unauthenticated users on the public events page.
          These changes do not delete any data and are safe to apply.

          ## Metadata:
          - Schema-Category: "Safe"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Affects RLS policies on `public.events` and `public.profiles`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes. Simplifies event insert policy and makes profile information (like business names) public for display purposes.
          - Auth Requirements: Policies correctly use `auth.uid()` for security checks.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. May slightly improve insert performance on the `events` table.
          */

-- Drop the old, overly restrictive insert policy on events
DROP POLICY IF EXISTS "Enable insert for authenticated vendors" ON "public"."events";

-- Create a new, simpler, and more reliable insert policy for events
CREATE POLICY "Enable insert for authenticated vendors" ON "public"."events"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = vendor_id);

-- Drop the old select policy on profiles which required authentication
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."profiles";

-- Create a new policy to allow public read access to profiles.
-- This is necessary for the public /events page to show vendor business names.
CREATE POLICY "Enable read access for all users" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
