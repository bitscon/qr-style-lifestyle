
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type ShippingDetails = {
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  email: string;
};

export function Checkout() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: "",
    address1: "",
    city: "",
    state: "",
    zip: "",
    email: user?.email || "",
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user?.id,
            product_id: productId,
            amount: product?.price,
            status: "pending",
            qr_code_url: "", // Will be updated after QR generation
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order in Printful
      const { error: printfulError } = await supabase.functions.invoke("printful", {
        body: {
          action: "createOrder",
          productId: product?.printful_id,
          shippingDetails,
        },
      });

      if (printfulError) throw printfulError;

      // Generate QR code
      const { error: qrError } = await supabase.functions.invoke("generate-qr", {
        body: { orderId: order.id },
      });

      if (qrError) throw qrError;

      return order;
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully",
        description: "You will receive an email with your order details",
      });
      navigate("/dashboard/orders");
    },
    onError: (error) => {
      toast({
        title: "Error placing order",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  if (productLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!product) {
    return <div className="p-8">Product not found</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Complete your order for {product.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between items-center">
              <span>{product.name}</span>
              <span className="font-bold">${product.price}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={shippingDetails.name}
                onChange={(e) =>
                  setShippingDetails((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                required
                value={shippingDetails.address1}
                onChange={(e) =>
                  setShippingDetails((prev) => ({ ...prev, address1: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={shippingDetails.city}
                  onChange={(e) =>
                    setShippingDetails((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  required
                  value={shippingDetails.state}
                  onChange={(e) =>
                    setShippingDetails((prev) => ({ ...prev, state: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                required
                value={shippingDetails.zip}
                onChange={(e) =>
                  setShippingDetails((prev) => ({ ...prev, zip: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={shippingDetails.email}
                onChange={(e) =>
                  setShippingDetails((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            onClick={() => createOrder.mutate()}
            disabled={createOrder.isPending}
          >
            {createOrder.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Place Order (${product.price})
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
