
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
      if (!id) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Page;
    },
    enabled: !!id,
  });

  // Update local state when page data is loaded
  useEffect(() => {
    if (page) {
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
      const supabaseData = {
        title: data.title,
        content: data.content as unknown as Json,
        is_published: data.is_published,
        user_id: user?.id,
      };

      if (id) {
        const { error } = await supabase
          .from("pages")
          .update(supabaseData)
          .eq("id", id);
        if (error) throw error;
        return { id }; // Return the existing page id
      } else {
        const { data: newPage, error } = await supabase
          .from("pages")
          .insert([supabaseData])
          .select()
          .single();
        if (error) throw error;
        return newPage;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Page ${id ? "updated" : "created"} successfully`,
      });
      if (!id) {
        navigate("/dashboard/pages");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvas) return;

    const content: PageContent = {
      template: selectedTemplate,
      canvasData: canvas.toJSON() as Record<string, any>,
    };

    mutation.mutate({
      title,
      content,
      is_published: isPublished,
    });
  };

  if (isLoading) {
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
