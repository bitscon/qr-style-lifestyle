
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function PageList() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Pages</h1>
        <Button onClick={() => navigate("/dashboard/pages/new")}>
          <Plus className="mr-2 h-4 w-4" /> Create New Page
        </Button>
      </div>

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
