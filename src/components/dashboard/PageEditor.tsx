
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

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
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(JSON.stringify(page.content, null, 2));
      setIsPublished(page.is_published || false);
    }
  }, [page]);

  const mutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: any;
      is_published: boolean;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("pages")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pages").insert([
          {
            ...data,
            user_id: user?.id,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
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
    try {
      const contentObj = JSON.parse(content);
      mutation.mutate({
        title,
        content: contentObj,
        is_published: isPublished,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your content format",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter page title"
        />
      </div>

      <div>
        <Label htmlFor="content">Content (JSON)</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter page content in JSON format"
          rows={10}
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

      <div className="flex justify-end space-x-4">
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
      </div>
    </form>
  );
}
