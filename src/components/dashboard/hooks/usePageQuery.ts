
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "../types";
import { Json } from "@/integrations/supabase/types";

export function usePageQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["page", id],
    queryFn: async () => {
      console.log("PageQuery: Fetching page with ID:", id);
      if (!id) return null;
      
      try {
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("PageQuery: Error fetching page:", error);
          throw error;
        }
        
        console.log("PageQuery: Raw page data:", data);
        
        if (!data) {
          console.error("PageQuery: No data returned from Supabase");
          return null;
        }

        const pageData = data as unknown as {
          content: Json;
          created_at: string;
          id: string;
          is_published: boolean;
          qr_code_url: string | null;
          template_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };

        const contentObj = typeof pageData.content === 'object' && pageData.content !== null 
          ? pageData.content 
          : {};
        
        const transformedPage = {
          ...pageData,
          content: {
            template: (contentObj as any)?.template || "blank",
            canvasData: (contentObj as any)?.canvasData || null,
          },
        } as Page;

        console.log("PageQuery: Final transformed page:", transformedPage);
        
        return transformedPage;
      } catch (error) {
        console.error("PageQuery: Error in queryFn:", error);
        throw error;
      }
    },
    enabled: !!id,
  });
}
