
-- Waste categories enum
CREATE TYPE public.waste_category AS ENUM ('plastic', 'paper', 'metal', 'ewaste', 'glass');

-- Listing status enum
CREATE TYPE public.listing_status AS ENUM ('open', 'offered', 'accepted', 'collected', 'cancelled');

-- Offer status enum
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Waste listings table
CREATE TABLE public.waste_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category waste_category NOT NULL,
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  description TEXT,
  image_url TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  status listing_status NOT NULL DEFAULT 'open',
  accepted_offer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dealer offers table
CREATE TABLE public.dealer_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.waste_listings(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL,
  price_offered NUMERIC NOT NULL CHECK (price_offered > 0),
  message TEXT,
  status offer_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_listings 
  ADD CONSTRAINT waste_listings_accepted_offer_fkey 
  FOREIGN KEY (accepted_offer_id) REFERENCES public.dealer_offers(id);

ALTER TABLE public.waste_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open listings" ON public.waste_listings
  FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON public.waste_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.waste_listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Listing owner can view offers" ON public.dealer_offers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.waste_listings WHERE id = listing_id AND user_id = auth.uid())
    OR dealer_id = auth.uid()
  );
CREATE POLICY "Dealers can create offers" ON public.dealer_offers
  FOR INSERT WITH CHECK (
    auth.uid() = dealer_id AND has_role(auth.uid(), 'scrap_dealer')
  );
CREATE POLICY "Dealers can update own offers" ON public.dealer_offers
  FOR UPDATE USING (auth.uid() = dealer_id);

CREATE TRIGGER update_waste_listings_updated_at
  BEFORE UPDATE ON public.waste_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dealer_offers_updated_at
  BEFORE UPDATE ON public.dealer_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
