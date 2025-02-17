
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Page } from "./types";

interface QRCodeSectionProps {
  page: Page | null;
}

export function QRCodeSection({ page }: QRCodeSectionProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async (pageId: string) => {
    setIsGeneratingQR(true);
    try {
      const { error } = await supabase.functions.invoke('generate-qr', {
        body: { pageId },
      });
      if (error) throw error;
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

  if (!page) return null;

  if (page.qr_code_url) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <img 
            src={page.qr_code_url} 
            alt="Page QR Code"
            className="max-w-[200px] mx-auto"
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => window.open(page.qr_code_url, '_blank')}
          >
            Download QR Code
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (page.is_published) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => generateQRCode(page.id)}
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

  return null;
}
