
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export function Products() {
  const navigate = useNavigate();
  
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading products...</div>;
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-semibold mb-2">No products available</h2>
        <p className="text-muted-foreground">Check back later for new items</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Our Products</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-bold text-primary">${product.price}</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  QR-enabled wearable that connects to your digital presence
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => navigate(`/checkout/${product.id}`)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
