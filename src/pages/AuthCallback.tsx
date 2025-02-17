
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get the URL hash and parse it to check for access_token and type
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (accessToken && type === "signup") {
      // Set the session using the tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      }).then(({ error }) => {
        if (error) {
          toast({
            title: "Error verifying email",
            description: error.message,
            variant: "destructive",
          });
          navigate("/auth");
        } else {
          toast({
            title: "Email verified successfully",
            description: "You can now sign in to your account",
          });
          navigate("/auth");
        }
      });
    } else {
      navigate("/auth");
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait while we verify your email address.</p>
      </div>
    </div>
  );
}
