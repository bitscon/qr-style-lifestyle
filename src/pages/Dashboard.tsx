
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
  CardFooter,
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
  LogOut,
  Smartphone,
  QrCode,
  Download,
  Loader2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { toast } = useToast();

  const { data: profile, refetch: refetchProfile } = useQuery({
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

  const { data: publishedPage } = useQuery({
    queryKey: ["published-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const generateQRCode = async () => {
    if (!user) return;
    
    setIsGeneratingQR(true);
    try {
      const { error } = await supabase.functions.invoke('generate-qr', {
        body: { userId: user.id },
      });
      if (error) throw error;
      
      await refetchProfile();
      
      toast({
        title: "QR Code generated successfully",
        description: "Scan it with your phone to test your published page",
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-2">Logout</span>
                </Button>
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
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Logout</span>
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          <Routes>
            <Route
              index
              element={
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* QR Code Card */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <QrCode className="h-6 w-6" />
                          Your Digital Identity
                        </CardTitle>
                        <CardDescription>
                          Generate your unique QR code to share your digital presence. This QR code will always point to your currently published page.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center space-y-4">
                        {profile?.qr_code_url ? (
                          <>
                            <div className="relative">
                              <img 
                                src={profile.qr_code_url} 
                                alt="Your QR Code"
                                className="max-w-[250px] mx-auto"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded">
                                <Button
                                  variant="secondary"
                                  onClick={() => window.open(profile.qr_code_url, '_blank')}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Smartphone className="h-4 w-4" />
                              <span>Scan with your phone's camera to test</span>
                            </div>
                          </>
                        ) : (
                          <Button
                            onClick={generateQRCode}
                            disabled={isGeneratingQR || !publishedPage}
                            className="w-full max-w-md"
                          >
                            {isGeneratingQR && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!publishedPage ? "Publish a page first" : "Generate QR Code"}
                          </Button>
                        )}
                      </CardContent>
                      {profile?.qr_code_url && (
                        <CardFooter className="justify-center text-sm text-muted-foreground">
                          This QR code will always point to your currently published page
                        </CardFooter>
                      )}
                    </Card>

                    {/* Welcome Card */}
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
