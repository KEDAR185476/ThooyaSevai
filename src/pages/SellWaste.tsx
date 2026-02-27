import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Camera, Upload, MapPin, Loader2, CheckCircle2, X,
  RotateCcw, Trash2, IndianRupee, Navigation, Package
} from "lucide-react";

type Step = "capture" | "details" | "submitting" | "done";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const CATEGORIES = [
  { value: "plastic", label: "Plastic", emoji: "♻️" },
  { value: "paper", label: "Paper", emoji: "📄" },
  { value: "metal", label: "Metal", emoji: "🔩" },
  { value: "ewaste", label: "E-Waste", emoji: "💻" },
  { value: "glass", label: "Glass", emoji: "🪟" },
] as const;

const SellWaste = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  const [category, setCategory] = useState<string>("plastic");
  const [quantityKg, setQuantityKg] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    getLocation();
    return () => stopCamera();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? "Location permission denied." : "Unable to get location.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamRef(stream);
      setCameraActive(true);
    } catch {
      toast.error("Unable to access camera.");
    }
  };

  const stopCamera = () => {
    streamRef?.getTracks().forEach((t) => t.stop());
    setStreamRef(null);
    setCameraActive(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setImageFile(new File([blob], `waste-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85
    );
    stopCamera();
    setStep("details");
  }, [streamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be < 10 MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
      setStep("details");
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setImageFile(null);
    setStep("capture");
  };

  const submitListing = async () => {
    if (!imageFile || !location || !user) { toast.error("Photo and location required"); return; }
    const qty = parseFloat(quantityKg);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }

    setStep("submitting");
    try {
      const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("report-images").upload(filePath, imageFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(filePath);

      const { error: insertErr } = await supabase.from("waste_listings").insert({
        user_id: user.id,
        category: category as any,
        quantity_kg: qty,
        description: description || null,
        image_url: urlData.publicUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || null,
      });
      if (insertErr) throw insertErr;

      setStep("done");
      toast.success("Waste listed for sale! Dealers will make offers soon.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit");
      setStep("details");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Sell Your Waste</h1>
          <p className="text-muted-foreground text-sm">Upload a photo, dealers will offer you money</p>
        </div>

        {/* Location */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${location ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">
                    {locationLoading ? "Getting location..." : location ? "Location captured" : "Location required"}
                  </p>
                  {location && (
                    <p className="text-xs text-muted-foreground">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </p>
                  )}
                  {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                </div>
              </div>
              {!locationLoading ? (
                <Button variant="ghost" size="icon" onClick={getLocation}><Navigation className="h-4 w-4" /></Button>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capture step */}
        {step === "capture" && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {cameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                    <Button size="lg" className="rounded-full h-16 w-16 shadow-lg" onClick={capturePhoto}>
                      <Camera className="h-7 w-7" />
                    </Button>
                    <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 self-end" onClick={stopCamera}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Take a photo of your waste material</p>
                  <div className="flex gap-3">
                    <Button onClick={startCamera} className="gap-2"><Camera className="h-4 w-4" /> Camera</Button>
                    <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </CardContent>
          </Card>
        )}

        {/* Details step */}
        {step === "details" && capturedImage && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <img src={capturedImage} alt="Waste material" className="w-full h-full object-cover" />
                <Button variant="secondary" size="icon" className="absolute top-3 right-3 rounded-full shadow" onClick={retake}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Waste Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm ${
                          category === cat.value
                            ? "border-primary bg-primary/5 font-medium"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="qty">Approximate Quantity (kg)</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Pickup Address (optional)</Label>
                  <Input id="address" placeholder="Street / landmark" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input id="desc" placeholder="e.g. cleaned bottles, sorted" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
                  <Trash2 className="h-4 w-4" /> Retake
                </Button>
                <Button className="flex-1 gap-2" disabled={!location || !quantityKg} onClick={submitListing}>
                  <IndianRupee className="h-4 w-4" /> List for Sale
                </Button>
              </div>

              {!location && (
                <p className="text-xs text-destructive text-center">Location is required.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submitting */}
        {step === "submitting" && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Posting your listing...</p>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {step === "done" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">Waste Listed!</p>
                <p className="text-sm text-muted-foreground mt-1">Scrap dealers in your area will make offers</p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => navigate("/my-listings")}>My Listings</Button>
                <Button onClick={retake} className="gap-2"><Package className="h-4 w-4" /> List More</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </DashboardLayout>
  );
};

export default SellWaste;
