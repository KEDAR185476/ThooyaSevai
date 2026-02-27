import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Package, IndianRupee, Loader2, MapPin, Send, CheckCircle2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface Listing {
  id: string;
  user_id: string;
  category: string;
  quantity_kg: number;
  description: string | null;
  image_url: string;
  address: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  plastic: "♻️", paper: "📄", metal: "🔩", ewaste: "💻", glass: "🪟",
};

const DealerDashboard = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myOffers, setMyOffers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: listingsData } = await supabase
      .from("waste_listings")
      .select("*")
      .in("status", ["open", "offered"])
      .order("created_at", { ascending: false });

    setListings((listingsData as Listing[]) || []);

    // Fetch my existing offers
    const { data: offersData } = await supabase
      .from("dealer_offers")
      .select("listing_id, price_offered")
      .eq("dealer_id", user.id)
      .eq("status", "pending");

    const map: Record<string, number> = {};
    (offersData || []).forEach((o: any) => { map[o.listing_id] = o.price_offered; });
    setMyOffers(map);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const submitOffer = async () => {
    if (!selectedListing || !user) return;
    const price = parseFloat(offerPrice);
    if (!price || price <= 0) { toast.error("Enter a valid price"); return; }

    setSubmittingOffer(true);
    try {
      const { error } = await supabase.from("dealer_offers").insert({
        listing_id: selectedListing,
        dealer_id: user.id,
        price_offered: price,
        message: offerMessage || null,
      });
      if (error) throw error;

      // Update listing status to offered
      await supabase
        .from("waste_listings")
        .update({ status: "offered" } as any)
        .eq("id", selectedListing)
        .eq("status", "open");

      toast.success("Offer sent!");
      setDialogOpen(false);
      setOfferPrice("");
      setOfferMessage("");
      setSelectedListing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to send offer");
    } finally {
      setSubmittingOffer(false);
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
        <div>
          <h1 className="text-2xl font-bold">Available Waste Listings</h1>
          <p className="text-muted-foreground text-sm">Browse listings and make offers to collect waste</p>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">No listings available</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for new waste listings</p>
            </CardContent>
          </Card>
        ) : (
          listings.map((listing) => {
            const alreadyOffered = myOffers[listing.id] !== undefined;
            return (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <img src={listing.image_url} alt="Waste" className="w-24 h-24 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_EMOJI[listing.category] || "📦"}</span>
                        <span className="font-semibold capitalize">{listing.category}</span>
                        <Badge variant="secondary" className="ml-auto">{listing.quantity_kg} kg</Badge>
                      </div>
                      {listing.description && (
                        <p className="text-sm text-muted-foreground">{listing.description}</p>
                      )}
                      {listing.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {listing.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>

                      <div className="pt-2">
                        {alreadyOffered ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Offered ₹{myOffers[listing.id]}
                          </Badge>
                        ) : (
                          <Dialog open={dialogOpen && selectedListing === listing.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) setSelectedListing(listing.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-1">
                                <IndianRupee className="h-3 w-3" /> Make Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Make an Offer</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                  <span className="text-2xl">{CATEGORY_EMOJI[listing.category]}</span>
                                  <div>
                                    <p className="font-medium capitalize">{listing.category} – {listing.quantity_kg} kg</p>
                                    {listing.address && <p className="text-xs text-muted-foreground">{listing.address}</p>}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Your Price (₹)</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 150"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Message (optional)</label>
                                  <Input
                                    placeholder="e.g. Can pick up tomorrow"
                                    value={offerMessage}
                                    onChange={(e) => setOfferMessage(e.target.value)}
                                  />
                                </div>
                                <Button className="w-full gap-2" onClick={submitOffer} disabled={submittingOffer}>
                                  {submittingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                  Send Offer
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default DealerDashboard;
