import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signInWithOAuth: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please check your email and click the verification link before signing in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
        throw error;
      }
      toast({
        title: "Signed in successfully",
      });
    } catch (error) {
      throw error;
    }
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error signing in",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast({
        title: "Sign up successful",
        description: "Please check your email for the confirmation link.",
      });
    } catch (error) {
      toast({
        title: "Error signing up",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the reset link.",
      });
    } catch (error) {
      toast({
        title: "Error resetting password",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signOut,
        signInWithEmail,
        signInWithOAuth,
        signUp,
        resetPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
