import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, IndianRupee, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Offer {
  id: string;
  dealer_id: string;
  price_offered: number;
  message: string | null;
  status: string;
  created_at: string;
}

interface Listing {
  id: string;
  category: string;
  quantity_kg: number;
  description: string | null;
  image_url: string;
  address: string | null;
  status: string;
  created_at: string;
  accepted_offer_id: string | null;
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  offered: { label: "Offers In", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  collected: { label: "Collected", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  plastic: "♻️", paper: "📄", metal: "🔩", ewaste: "💻", glass: "🪟",
};

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Record<string, Offer[]>>({});
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: listingsData } = await supabase
      .from("waste_listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setListings((listingsData as Listing[]) || []);

    if (listingsData && listingsData.length > 0) {
      const ids = listingsData.map((l: any) => l.id);
      const { data: offersData } = await supabase
        .from("dealer_offers")
        .select("*")
        .in("listing_id", ids)
        .order("price_offered", { ascending: false });

      const grouped: Record<string, Offer[]> = {};
      (offersData || []).forEach((o: any) => {
        if (!grouped[o.listing_id]) grouped[o.listing_id] = [];
        grouped[o.listing_id].push(o as Offer);
      });
      setOffers(grouped);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const acceptOffer = async (listingId: string, offerId: string) => {
    setAccepting(offerId);
    try {
      // Update offer status
      const { error: e1 } = await supabase
        .from("dealer_offers")
        .update({ status: "accepted" } as any)
        .eq("id", offerId);
      if (e1) throw e1;

      // Reject other offers
      const { error: e2 } = await supabase
        .from("dealer_offers")
        .update({ status: "rejected" } as any)
        .eq("listing_id", listingId)
        .neq("id", offerId);
      if (e2) throw e2;

      // Update listing
      const { error: e3 } = await supabase
        .from("waste_listings")
        .update({ status: "accepted", accepted_offer_id: offerId } as any)
        .eq("id", listingId);
      if (e3) throw e3;

      toast.success("Offer accepted! The dealer will contact you for pickup.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept offer");
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-muted-foreground text-sm">Track your waste listings and offers</p>
          </div>
          <Button onClick={() => navigate("/sell-waste")} className="gap-2">
            <Package className="h-4 w-4" /> New Listing
          </Button>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">No listings yet</p>
              <p className="text-sm text-muted-foreground mt-1">List your waste and earn money from scrap dealers</p>
              <Button className="mt-4" onClick={() => navigate("/sell-waste")}>Sell Waste</Button>
            </CardContent>
          </Card>
        ) : (
          listings.map((listing) => {
            const listingOffers = offers[listing.id] || [];
            const badge = statusBadge[listing.status] || statusBadge.open;
            return (
              <Card key={listing.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={listing.image_url}
                      alt="Waste"
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{CATEGORY_EMOJI[listing.category] || "📦"}</span>
                        <span className="font-semibold capitalize">{listing.category}</span>
                        <Badge variant={badge.variant} className="ml-auto text-xs">{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{listing.quantity_kg} kg</p>
                      {listing.address && <p className="text-xs text-muted-foreground truncate">{listing.address}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Offers */}
                  {listingOffers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" /> {listingOffers.length} offer{listingOffers.length > 1 ? "s" : ""}
                      </p>
                      {listingOffers.map((offer) => (
                        <div key={offer.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">₹{offer.price_offered}</p>
                            {offer.message && <p className="text-xs text-muted-foreground truncate">{offer.message}</p>}
                          </div>
                          {offer.status === "pending" && listing.status !== "accepted" && (
                            <Button
                              size="sm"
                              disabled={accepting === offer.id}
                              onClick={() => acceptOffer(listing.id, offer.id)}
                              className="gap-1"
                            >
                              {accepting === offer.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Accept
                            </Button>
                          )}
                          {offer.status === "accepted" && (
                            <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Accepted</Badge>
                          )}
                          {offer.status === "rejected" && (
                            <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {listingOffers.length === 0 && listing.status === "open" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border">
                      <Clock className="h-3 w-3" /> Waiting for dealer offers...
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyListings;
