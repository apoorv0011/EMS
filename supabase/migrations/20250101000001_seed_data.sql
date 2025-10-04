/*
# [Seed Data]
This script populates the database with initial data for testing and development. It includes categories and a default membership plan.

## Query Description: This script inserts sample data. It is safe to run on a new database but may cause conflicts if run multiple times (due to unique constraints).

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (data can be manually deleted)

## Structure Details:
- Tables affected: categories, memberships

## Security Implications:
- RLS Status: N/A
- Policy Changes: No
- Auth Requirements: Should be run by an admin/service role.

## Performance Impact:
- Indexes: N/A
- Triggers: N/A
- Estimated Impact: Negligible.
*/

-- Seed Categories
INSERT INTO public.categories (name, description) VALUES
('Electronics', 'Gadgets, devices, and accessories.'),
('Clothing', 'Apparel for all occasions.'),
('Home Goods', 'Items for your home and garden.'),
('Services', 'Professional services for events.'),
('Food & Beverage', 'Catering and food services.')
ON CONFLICT (name) DO NOTHING;

-- Seed Membership Plan
INSERT INTO public.memberships (name, description, price, duration_days) VALUES
('Pro Vendor', 'Unlock advanced features for vendors.', 29.99, 30)
ON CONFLICT (name) DO NOTHING;
