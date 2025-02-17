
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Page } from "./types";

interface QRCodeSectionProps {
  page: Page | null;
}

export function QRCodeSection({ page }: QRCodeSectionProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [userQrCode, setUserQrCode] = useState<string | null>(null);

  // Fetch user's QR code on component mount
  const fetchUserQrCode = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('qr_code_url')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setUserQrCode(data.qr_code_url);
    }
  };

  const generateQRCode = async () => {
    if (!user) return;
    
    setIsGeneratingQR(true);
    try {
      const { error } = await supabase.functions.invoke('generate-qr', {
        body: { userId: user.id },
      });
      if (error) throw error;
      
      // Fetch the updated QR code URL
      await fetchUserQrCode();
      
      toast({
        title: "QR Code generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  if (!page?.is_published) return null;

  if (userQrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <img 
            src={userQrCode} 
            alt="Your QR Code"
            className="max-w-[200px] mx-auto"
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => window.open(userQrCode, '_blank')}
          >
            Download QR Code
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Your QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateQRCode}
          disabled={isGeneratingQR}
          className="w-full"
        >
          {isGeneratingQR && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
