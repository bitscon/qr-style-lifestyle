
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function Orders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          products (
            name,
            description
          )
        `)
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
      <h1 className="text-3xl font-bold">Your Orders</h1>
      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
              <CardDescription>Status: {order.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.products?.description}
                  </p>
                </div>
                <p className="text-xl font-bold">${order.amount}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
