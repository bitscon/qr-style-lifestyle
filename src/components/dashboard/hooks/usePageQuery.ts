
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

        // Ensure content is properly typed and transformed
        const content = data.content as Json;
        
        const transformedPage: Page = {
          ...data,
          content: {
            template: typeof content === 'object' && content !== null 
              ? (content.template as string) || "blank"
              : "blank",
            canvasData: typeof content === 'object' && content !== null 
              ? content.canvasData || null
              : null,
          },
        };

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
