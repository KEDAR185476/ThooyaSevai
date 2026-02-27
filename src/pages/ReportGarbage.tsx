import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Camera, Upload, MapPin, Loader2, CheckCircle2, X,
  RotateCcw, Trash2, Sparkles, Navigation
} from "lucide-react";

type Step = "capture" | "review" | "submitting" | "done";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const ReportGarbage = () => {
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

  // Get live location on mount
  useEffect(() => {
    getLocation();
    return () => stopCamera();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Location permission denied. Please enable it in your browser settings."
            : "Unable to get your location. Please try again."
        );
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
      toast.error("Unable to access camera. Please allow camera permissions or upload a photo.");
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setImageFile(new File([blob], `report-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85
    );
    stopCamera();
    setStep("review");
  }, [streamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10 MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
      setStep("review");
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setImageFile(null);
    setStep("capture");
  };

  const submitReport = async () => {
    if (!imageFile || !location || !user) {
      toast.error("Photo and location are required");
      return;
    }
    setStep("submitting");

    try {
      // Upload image
      const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("report-images")
        .getPublicUrl(filePath);

      // Insert report
      const { error: insertError } = await supabase.from("reports").insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        status: "pending",
      });
      if (insertError) throw insertError;

      setStep("done");
      toast.success("Report submitted successfully! +10 points 🎉");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit report");
      setStep("review");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Report Garbage</h1>
          <p className="text-muted-foreground text-sm">Take a photo and share the location</p>
        </div>

        {/* Location Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${location ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">
                    {locationLoading
                      ? "Getting location..."
                      : location
                      ? "Location captured"
                      : "Location required"}
                  </p>
                  {location && (
                    <p className="text-xs text-muted-foreground">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                      {location.accuracy < 100 && (
                        <span className="ml-1 text-primary">
                          (±{Math.round(location.accuracy)}m)
                        </span>
                      )}
                    </p>
                  )}
                  {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                </div>
              </div>
              {!locationLoading && (
                <Button variant="ghost" size="icon" onClick={getLocation}>
                  <Navigation className="h-4 w-4" />
                </Button>
              )}
              {locationLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          </CardContent>
        </Card>

        {/* Step: Capture */}
        {step === "capture" && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {cameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                    <Button
                      size="lg"
                      className="rounded-full h-16 w-16 shadow-lg"
                      onClick={capturePhoto}
                    >
                      <Camera className="h-7 w-7" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full h-12 w-12 self-end"
                      onClick={() => { stopCamera(); }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Take a photo of garbage or upload one
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={startCamera} className="gap-2">
                      <Camera className="h-4 w-4" /> Open Camera
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Step: Review */}
        {step === "review" && capturedImage && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <img
                  src={capturedImage}
                  alt="Captured garbage"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 rounded-full shadow"
                  onClick={retake}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
                  <Trash2 className="h-4 w-4" /> Retake
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!location}
                  onClick={submitReport}
                >
                  <Sparkles className="h-4 w-4" /> Submit Report
                </Button>
              </div>

              {!location && (
                <p className="text-xs text-destructive text-center">
                  Location is required to submit. Please enable location access.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Submitting */}
        {step === "submitting" && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Submitting your report...</p>
              <p className="text-sm text-muted-foreground">Uploading image and saving location</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">Report Submitted!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thank you for keeping Madurai clean
                </p>
                <Badge className="mt-3 bg-accent/10 text-accent border-accent/20">+10 Points</Badge>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={retake} className="gap-2">
                  <Camera className="h-4 w-4" /> Report Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </DashboardLayout>
  );
};

export default ReportGarbage;
