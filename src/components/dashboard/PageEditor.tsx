
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Canvas } from "fabric";
import { PageHeaderForm } from "./PageHeaderForm";
import { PageEditorTabs } from "./PageEditorTabs";
import { QRCodeSection } from "./QRCodeSection";
import { PageContent, Page } from "./types";
import { Json } from "@/integrations/supabase/types";

export function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTab, setActiveTab] = useState("editor");

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", id],
    queryFn: async () => {
      console.log("PageEditor: Fetching page with ID:", id);
      if (!id) return null;
      
      try {
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("PageEditor: Error fetching page:", error);
          throw error;
        }
        
        console.log("PageEditor: Raw page data:", data);
        
        // Convert the raw data to our Page type
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

        console.log("PageEditor: Transformed pageData:", pageData);

        // Safely access the content object
        const contentObj = typeof pageData.content === 'object' ? pageData.content : {};
        
        const transformedPage = {
          ...pageData,
          content: {
            template: (contentObj as any)?.template || "blank",
            canvasData: (contentObj as any)?.canvasData || {},
          },
        } as Page;

        console.log("PageEditor: Final transformed page:", transformedPage);
        return transformedPage;
      } catch (error) {
        console.error("PageEditor: Error in queryFn:", error);
        throw error;
      }
    },
    enabled: !!id,
  });

  useEffect(() => {
    console.log("PageEditor: useEffect - page data changed:", page);
    if (page) {
      console.log("PageEditor: Setting local state with:", {
        title: page.title,
        isPublished: page.is_published,
        template: page.content?.template
      });
      setTitle(page.title);
      setIsPublished(page.is_published || false);
      if (page.content?.template) {
        setSelectedTemplate(page.content.template);
      }
    }
  }, [page]);

  const mutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: PageContent;
      is_published: boolean;
    }) => {
      console.log("PageEditor: Starting save mutation with data:", data);
      
      try {
        const supabaseData = {
          title: data.title,
          content: data.content as unknown as Json,
          is_published: data.is_published,
          user_id: user?.id,
        };

        console.log("PageEditor: Transformed Supabase data:", supabaseData);

        if (id) {
          console.log("PageEditor: Updating existing page:", id);
          const { data: updatedData, error } = await supabase
            .from("pages")
            .update(supabaseData)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            console.error("PageEditor: Error updating page:", error);
            throw error;
          }

          console.log("PageEditor: Update successful:", updatedData);
          return { id };
        } else {
          console.log("PageEditor: Creating new page");
          const { data: newPage, error } = await supabase
            .from("pages")
            .insert([supabaseData])
            .select()
            .single();

          if (error) {
            console.error("PageEditor: Error creating page:", error);
            throw error;
          }

          console.log("PageEditor: Create successful:", newPage);
          return newPage;
        }
      } catch (error) {
        console.error("PageEditor: Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("PageEditor: Mutation success:", data);
      toast({
        title: "Success",
        description: `Page ${id ? "updated" : "created"} successfully`,
      });
      if (!id) {
        navigate("/dashboard/pages");
      }
    },
    onError: (error) => {
      console.error("PageEditor: Mutation error:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("PageEditor: Handle submit called");
    console.log("PageEditor: Current canvas state:", canvas);
    
    if (!canvas) {
      console.error("PageEditor: No canvas available");
      return;
    }

    const content: PageContent = {
      template: selectedTemplate,
      canvasData: canvas.toJSON() as Record<string, any>,
    };

    console.log("PageEditor: Submitting content:", content);

    mutation.mutate({
      title,
      content,
      is_published: isPublished,
    });
  };

  if (isLoading) {
    console.log("PageEditor: Loading state");
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeaderForm
          title={title}
          setTitle={setTitle}
          isPublished={isPublished}
          setIsPublished={setIsPublished}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />

        <Card>
          <CardHeader>
            <CardTitle>Page Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <PageEditorTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCanvasReady={setCanvas}
              initialCanvasData={page?.content?.canvasData}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/pages")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : id
                ? "Update Page"
                : "Create Page"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <QRCodeSection page={page} />
    </div>
  );
}
