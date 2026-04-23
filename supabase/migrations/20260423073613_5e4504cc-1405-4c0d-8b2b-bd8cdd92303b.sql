
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('customer', 'provider', 'vendor', 'admin');
CREATE TYPE public.listing_type AS ENUM ('service', 'product');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to check role (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ur TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  type public.listing_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_unit TEXT DEFAULT 'per visit',
  city TEXT,
  image_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_city ON public.services(city);
CREATE INDEX idx_services_category ON public.services(category_id);

-- Vendors (shop profile)
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  city TEXT,
  banner_url TEXT,
  logo_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_vendor ON public.products(vendor_id);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((service_id IS NOT NULL)::int + (product_id IS NOT NULL)::int = 1)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_convo ON public.messages(conversation_id, created_at DESC);

-- Helper: is participant in conversation
CREATE OR REPLACE FUNCTION public.is_convo_participant(_convo_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _convo_id AND (user1_id = _user_id OR user2_id = _user_id)
  )
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- default role = customer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RLS POLICIES ==========

-- profiles
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories
CREATE POLICY "categories readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- services
CREATE POLICY "active services readable" ON public.services FOR SELECT USING (is_active OR auth.uid() = provider_id);
CREATE POLICY "providers insert own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "providers update own services" ON public.services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "providers delete own services" ON public.services FOR DELETE USING (auth.uid() = provider_id);

-- vendors
CREATE POLICY "vendors readable" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "users insert own vendor" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owners update vendor" ON public.vendors FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owners delete vendor" ON public.vendors FOR DELETE USING (auth.uid() = owner_id);

-- products
CREATE POLICY "active products readable" ON public.products FOR SELECT USING (
  is_active OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
);
CREATE POLICY "vendor owners manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
);

-- bookings
CREATE POLICY "participants view bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);
CREATE POLICY "customers create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "participants update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- reviews
CREATE POLICY "reviews readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "auth users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authors update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "authors delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = author_id);

-- conversations
CREATE POLICY "participants view conversations" ON public.conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "users create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- messages
CREATE POLICY "participants view messages" ON public.messages FOR SELECT USING (public.is_convo_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND public.is_convo_participant(conversation_id, auth.uid())
);

-- Seed categories
INSERT INTO public.categories (name, name_ur, slug, icon, type) VALUES
  ('Plumber', 'پلمبر', 'plumber', 'Wrench', 'service'),
  ('Electrician', 'الیکٹریشن', 'electrician', 'Zap', 'service'),
  ('Mechanic', 'مکینک', 'mechanic', 'Car', 'service'),
  ('Carpenter', 'بڑھئی', 'carpenter', 'Hammer', 'service'),
  ('Cleaner', 'صفائی والا', 'cleaner', 'Sparkles', 'service'),
  ('Painter', 'پینٹر', 'painter', 'Paintbrush', 'service'),
  ('AC Repair', 'اے سی مرمت', 'ac-repair', 'Wind', 'service'),
  ('Tutor', 'استاد', 'tutor', 'BookOpen', 'service'),
  ('Groceries', 'گروسری', 'groceries', 'ShoppingBasket', 'product'),
  ('Electronics', 'الیکٹرانکس', 'electronics', 'Smartphone', 'product'),
  ('Clothing', 'کپڑے', 'clothing', 'Shirt', 'product'),
  ('Home & Kitchen', 'گھر اور کچن', 'home-kitchen', 'Home', 'product');
