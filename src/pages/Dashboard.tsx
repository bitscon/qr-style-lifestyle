import { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageEditor } from "@/components/dashboard/PageEditor";
import { PageList } from "@/components/dashboard/PageList";
import { Products } from "@/components/dashboard/Products";
import { Orders } from "@/components/dashboard/Orders";
import { Settings } from "@/components/dashboard/Settings";
import {
  LayoutDashboard,
  FileEdit,
  Package,
  ShoppingCart,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const menuItems = [
    {
      label: "Overview",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/dashboard",
    },
    {
      label: "Pages",
      icon: <FileEdit className="h-5 w-5" />,
      path: "/dashboard/pages",
    },
    {
      label: "Products",
      icon: <Package className="h-5 w-5" />,
      path: "/dashboard/products",
    },
    {
      label: "Orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      path: "/dashboard/orders",
    },
    {
      label: "Settings",
      icon: <SettingsIcon className="h-5 w-5" />,
      path: "/dashboard/settings",
    },
  ];

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={() => {
        navigate(item.path);
        setIsMobileMenuOpen(false);
      }}
    >
      {item.icon}
      <span className="ml-2">{item.label}</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-16 px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-4">
                {menuItems.map((item) => (
                  <MenuItem key={item.path} item={item} />
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-4 text-lg font-semibold">QRLife</div>
        </div>
      </header>

      <div className="flex h-screen pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed border-r bg-background">
          <div className="p-6">
            <Link to="/" className="text-2xl font-bold">
              QRLife
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          <Routes>
            <Route
              index
              element={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}</CardTitle>
                      <CardDescription>
                        Manage your digital identity and QR-enabled products
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => navigate("/dashboard/pages/new")}
                        className="w-full"
                      >
                        Create New Page
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              }
            />
            <Route path="pages" element={<PageList />} />
            <Route path="pages/new" element={<PageEditor />} />
            <Route path="pages/:id" element={<PageEditor />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
