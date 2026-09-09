-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- bootstrap: first user to claim admin when none exists
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN public.has_role(v_user,'admin');
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_user,'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INGREDIENTS / INVENTORY
CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('base','sauce','cheese','veggie')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 20,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ingredients TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ingredients" ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage ingredients" ON public.ingredients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PIZZAS
CREATE TABLE public.pizzas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_key text NOT NULL DEFAULT 'margherita',
  price numeric(10,2) NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  ingredient_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pizzas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pizzas TO authenticated;
GRANT ALL ON public.pizzas TO service_role;
ALTER TABLE public.pizzas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pizzas" ON public.pizzas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage pizzas" ON public.pizzas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CART
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_key text NOT NULL DEFAULT 'custom',
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  ingredient_ids uuid[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Order Received'
    CHECK (status IN ('Order Received','In Kitchen','Sent to Delivery','Delivered','Cancelled')),
  customer_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_id text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_key text NOT NULL DEFAULT 'custom',
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "admins read order items" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- PLACE ORDER (atomic stock check + deduction)
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name text, p_phone text, p_address text, p_payment_id text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order uuid;
  v_sub numeric := 0;
  v_fee numeric := 49;
  v_short text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(SUM(unit_price * quantity),0) INTO v_sub FROM public.cart_items WHERE user_id = v_user;
  IF v_sub = 0 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  CREATE TEMP TABLE _need ON COMMIT DROP AS
    SELECT ing AS ingredient_id, SUM(c.quantity)::int AS qty
    FROM public.cart_items c, UNNEST(c.ingredient_ids) AS ing
    WHERE c.user_id = v_user GROUP BY ing;

  SELECT string_agg(i.name, ', ') INTO v_short
  FROM _need n JOIN public.ingredients i ON i.id = n.ingredient_id
  WHERE i.stock_qty < n.qty;

  IF v_short IS NOT NULL THEN
    RAISE EXCEPTION 'OUT_OF_STOCK: %', v_short;
  END IF;

  UPDATE public.ingredients i SET stock_qty = i.stock_qty - n.qty
  FROM _need n WHERE i.id = n.ingredient_id;

  INSERT INTO public.orders (user_id, customer_name, phone, address, subtotal, delivery_fee, total, payment_id)
  VALUES (v_user, p_customer_name, p_phone, p_address, v_sub, v_fee, v_sub + v_fee, p_payment_id)
  RETURNING id INTO v_order;

  INSERT INTO public.order_items (order_id, name, image_key, unit_price, quantity, details)
  SELECT v_order, name, image_key, unit_price, quantity, details
  FROM public.cart_items WHERE user_id = v_user;

  DELETE FROM public.cart_items WHERE user_id = v_user;
  RETURN v_order;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text) TO authenticated;

-- SEED
INSERT INTO public.ingredients (name, category, price, stock_qty, low_stock_threshold, sort_order) VALUES
 ('Classic Hand Tossed','base',0,60,20,1),
 ('Thin Crust','base',20,45,20,2),
 ('Cheese Burst','base',60,30,20,3),
 ('Whole Wheat','base',30,25,20,4),
 ('Sourdough Artisan','base',80,18,20,5),
 ('Classic Tomato','sauce',0,50,20,1),
 ('Spicy Peri Peri','sauce',20,40,20,2),
 ('Creamy Alfredo','sauce',30,35,20,3),
 ('Pesto Basil','sauce',35,22,20,4),
 ('BBQ Smoke','sauce',25,28,20,5),
 ('Mozzarella','cheese',40,70,25,1),
 ('Cheddar','cheese',45,50,25,2),
 ('Parmesan','cheese',55,30,25,3),
 ('Vegan Cheese','cheese',60,20,25,4),
 ('Onion','veggie',15,80,25,1),
 ('Capsicum','veggie',15,75,25,2),
 ('Mushroom','veggie',25,40,25,3),
 ('Black Olives','veggie',30,35,25,4),
 ('Sweet Corn','veggie',20,60,25,5),
 ('Jalapeno','veggie',25,30,25,6),
 ('Paneer','veggie',45,40,25,7),
 ('Cherry Tomato','veggie',20,45,25,8);

INSERT INTO public.pizzas (name, description, image_key, price, ingredient_ids)
SELECT 'Margherita Classica','Hand tossed base, classic tomato, generous mozzarella and fresh basil.','margherita',249,
  ARRAY[(SELECT id FROM public.ingredients WHERE name='Classic Hand Tossed'),
        (SELECT id FROM public.ingredients WHERE name='Classic Tomato'),
        (SELECT id FROM public.ingredients WHERE name='Mozzarella')];
INSERT INTO public.pizzas (name, description, image_key, price, ingredient_ids)
SELECT 'Peri Peri Paneer','Thin crust, fiery peri peri sauce, paneer, onion and capsicum.','paneer',379,
  ARRAY[(SELECT id FROM public.ingredients WHERE name='Thin Crust'),
        (SELECT id FROM public.ingredients WHERE name='Spicy Peri Peri'),
        (SELECT id FROM public.ingredients WHERE name='Mozzarella'),
        (SELECT id FROM public.ingredients WHERE name='Paneer'),
        (SELECT id FROM public.ingredients WHERE name='Onion'),
        (SELECT id FROM public.ingredients WHERE name='Capsicum')];
INSERT INTO public.pizzas (name, description, image_key, price, ingredient_ids)
SELECT 'Veggie Supreme','Loaded with mushroom, olives, corn, capsicum on a cheese burst base.','veggie',429,
  ARRAY[(SELECT id FROM public.ingredients WHERE name='Cheese Burst'),
        (SELECT id FROM public.ingredients WHERE name='Classic Tomato'),
        (SELECT id FROM public.ingredients WHERE name='Mozzarella'),
        (SELECT id FROM public.ingredients WHERE name='Mushroom'),
        (SELECT id FROM public.ingredients WHERE name='Black Olives'),
        (SELECT id FROM public.ingredients WHERE name='Sweet Corn'),
        (SELECT id FROM public.ingredients WHERE name='Capsicum')];
INSERT INTO public.pizzas (name, description, image_key, price, ingredient_ids)
SELECT 'Quattro Formaggi','Four cheese indulgence on sourdough with creamy alfredo.','cheese',459,
  ARRAY[(SELECT id FROM public.ingredients WHERE name='Sourdough Artisan'),
        (SELECT id FROM public.ingredients WHERE name='Creamy Alfredo'),
        (SELECT id FROM public.ingredients WHERE name='Mozzarella'),
        (SELECT id FROM public.ingredients WHERE name='Cheddar'),
        (SELECT id FROM public.ingredients WHERE name='Parmesan')];