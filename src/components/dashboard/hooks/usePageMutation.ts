
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageContent } from "../types";

export function usePageMutation(id: string | undefined, user: any) {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: PageContent;
      is_published: boolean;
    }) => {
      console.log("PageMutation: Starting save mutation with data:", data);
      
      try {
        const supabaseData = {
          title: data.title,
          content: data.content,
          is_published: data.is_published,
          user_id: user?.id,
        };

        console.log("PageMutation: Transformed Supabase data:", supabaseData);

        if (id) {
          console.log("PageMutation: Updating existing page:", id);
          const { data: updatedData, error } = await supabase
            .from("pages")
            .update(supabaseData)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            console.error("PageMutation: Error updating page:", error);
            throw error;
          }

          console.log("PageMutation: Update successful:", updatedData);
          return { id };
        } else {
          console.log("PageMutation: Creating new page");
          const { data: newPage, error } = await supabase
            .from("pages")
            .insert([supabaseData])
            .select()
            .single();

          if (error) {
            console.error("PageMutation: Error creating page:", error);
            throw error;
          }

          console.log("PageMutation: Create successful:", newPage);
          return newPage;
        }
      } catch (error) {
        console.error("PageMutation: Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("PageMutation: Mutation success:", data);
      toast({
        title: "Success",
        description: `Page ${id ? "updated" : "created"} successfully`,
      });
      if (!id) {
        navigate("/dashboard/pages");
      }
    },
    onError: (error) => {
      console.error("PageMutation: Mutation error:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
