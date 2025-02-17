
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CanvasEditor } from "./CanvasEditor";
import { QRCodeSection } from "./QRCodeSection";
import { PageContent, Page } from "./types";

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

  const mutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: PageContent;
      is_published: boolean;
    }) => {
      const payload = {
        ...data,
        content: data.content as unknown as Record<string, any>,
      };

      if (id) {
        const { error } = await supabase
          .from("pages")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: newPage, error } = await supabase
          .from("pages")
          .insert([
            {
              ...payload,
              user_id: user?.id,
            },
          ])
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
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
              className="max-w-md"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="published">Published</Label>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Blank Page</SelectItem>
              <SelectItem value="business">Business Card</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="editor">Visual Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <CanvasEditor onCanvasReady={setCanvas} />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-lg p-4 min-h-[600px]">
                  Preview content will be shown here
                </div>
              </TabsContent>
            </Tabs>
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
