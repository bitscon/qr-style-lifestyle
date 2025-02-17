
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const TIER_LIMITS = {
  free: 1,
  basic: 3,
  premium: Infinity,
};

export function PageList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreatePage = () => {
    const currentTier = profile?.subscription_tier || 'free';
    const pageLimit = TIER_LIMITS[currentTier];
    
    if (pages && pages.length >= pageLimit) {
      toast({
        title: "Page Limit Reached",
        description: `Your ${currentTier} subscription allows up to ${pageLimit} ${pageLimit === 1 ? 'page' : 'pages'}. Upgrade to create more pages.`,
        variant: "destructive",
      });
      return;
    }
    
    navigate("/dashboard/pages/new");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const currentTier = profile?.subscription_tier || 'free';
  const pageLimit = TIER_LIMITS[currentTier];
  const pagesCreated = pages?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Pages</h1>
          <p className="text-muted-foreground mt-1">
            {pagesCreated} of {pageLimit === Infinity ? 'unlimited' : pageLimit} pages created
          </p>
        </div>
        <Button onClick={handleCreatePage}>
          <Plus className="mr-2 h-4 w-4" /> Create New Page
        </Button>
      </div>

      {pagesCreated >= pageLimit && currentTier !== 'premium' && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Subscription Limit Reached
            </CardTitle>
            <CardDescription>
              Upgrade your subscription to create more pages.
              {currentTier === 'free' 
                ? ' Basic tier allows up to 3 pages.'
                : ' Premium tier allows unlimited pages.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages?.map((page) => (
          <Card key={page.id} className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/dashboard/pages/${page.id}`)}
          >
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
              <CardDescription>
                {page.is_published ? "Published" : "Draft"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                {page.qr_code_url && (
                  <Button variant="ghost" size="sm">
                    View QR
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
