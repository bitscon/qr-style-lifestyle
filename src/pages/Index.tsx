
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleAuth = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleGetStarted = () => {
    handleAuth();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed w-full top-0 z-50 glass">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-primary">QRLife</div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
              {user ? (
                <>
                  <Button variant="default" onClick={handleAuth}>
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="default" onClick={handleAuth}>
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="section-padding pt-32">
          <div className="container mx-auto text-center">
            <div className="animate-fade-down">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Wear Your Digital Identity
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Create, customize, and share your digital presence with QR-enabled
                fashion. Change your story whenever you want.
              </p>
              <Button size="lg" className="animate-fade-up" onClick={handleGetStarted}>
                Start Your Journey
              </Button>
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Create",
                  description:
                    "Design your personal page with our easy-to-use editor",
                },
                {
                  title: "Generate",
                  description:
                    "Get your unique QR code that links to your page",
                },
                {
                  title: "Wear",
                  description:
                    "Choose from our premium apparel and wear your story",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="glass p-6 rounded-lg text-center animate-fade-up"
                  style={{
                    animationDelay: `${index * 200}ms`,
                  }}
                >
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Ready to Get Started?</h2>
            <Button size="lg" variant="default" onClick={handleGetStarted}>
              Create Your Page
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 QRLife. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
