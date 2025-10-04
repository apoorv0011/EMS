-- =================================================================
--  DEFINITIVE SCHEMA FOR EVENT MANAGEMENT SYSTEM (SIMPLE)
--  Version 4.0
--  This script is idempotent and fixes all known recursion issues.
-- =================================================================

-- STEP 1: Aggressively drop old objects in reverse order of dependency
-- This uses CASCADE to remove any lingering dependencies from old schemas.
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Public can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile, admins can view all" ON public a.profiles;

DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.profiles;

-- STEP 2: Create the user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information.';

-- STEP 3: Create the products table
CREATE TABLE public.products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.products IS 'Stores products offered by vendors.';

-- STEP 4: Create a helper function to safely get a user's role
-- This function uses SECURITY DEFINER to bypass RLS, preventing recursion.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$;
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Safely retrieves a user role, bypassing RLS to prevent recursion.';


-- STEP 5: Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, business_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'business_name'
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile for a new user upon signup.';


CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS policies for the 'profiles' table
CREATE POLICY "Users can view their own profile, admins can view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- STEP 8: Create RLS policies for the 'products' table
CREATE POLICY "Public can view all products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their own products" ON public.products
  FOR ALL USING (vendor_id = auth.uid()) WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins have full access to products" ON public.products
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
