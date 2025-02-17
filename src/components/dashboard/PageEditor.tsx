
import { useEffect, useState, useRef } from "react";
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
import { Canvas, TEvent, Text, Rect, Circle } from "fabric";
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
import { Loader2, Type, Image, Square, Circle as CircleIcon } from "lucide-react";

interface PageContent {
  template: string;
  canvasData: object;
}

export function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setIsPublished(page.is_published || false);
      const content = page.content as PageContent;
      if (content?.template) {
        setSelectedTemplate(content.template);
      }
    }
  }, [page]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    fabricCanvas.on('object:modified', saveCanvasState);
    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const saveCanvasState = (e: TEvent) => {
    if (!canvas) return;
    console.log('Canvas state updated:', canvas.toJSON());
  };

  const addText = () => {
    if (!canvas) return;
    const text = new Text('Click to edit text', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!canvas) return;
    
    const props = {
      left: 100,
      top: 100,
      fill: '#e9ecef',
      width: 100,
      height: 100,
      stroke: '#000000',
      strokeWidth: 1,
    };

    const shape = type === 'rectangle' 
      ? new Rect(props)
      : new Circle({ ...props, radius: 50 });

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const generateQRCode = async (pageId: string) => {
    setIsGeneratingQR(true);
    try {
      const { error } = await supabase.functions.invoke('generate-qr', {
        body: { pageId },
      });
      if (error) throw error;
      toast({
        title: "QR Code generated successfully",
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

  const mutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: PageContent;
      is_published: boolean;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("pages")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: newPage, error } = await supabase
          .from("pages")
          .insert([
            {
              ...data,
              user_id: user?.id,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        
        if (data.is_published && newPage) {
          await generateQRCode(newPage.id);
        }
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
      canvasData: canvas.toJSON(),
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
              <TabsContent value="editor" className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button type="button" variant="outline" onClick={addText}>
                    <Type className="mr-2 h-4 w-4" />
                    Add Text
                  </Button>
                  <Button type="button" variant="outline" onClick={() => addShape('rectangle')}>
                    <Square className="mr-2 h-4 w-4" />
                    Add Rectangle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => addShape('circle')}>
                    <Circle className="mr-2 h-4 w-4" />
                    Add Circle
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <canvas ref={canvasRef} />
                </div>
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

      {page?.qr_code_url && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={page.qr_code_url} 
              alt="Page QR Code"
              className="max-w-[200px] mx-auto"
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.open(page.qr_code_url, '_blank')}
            >
              Download QR Code
            </Button>
          </CardFooter>
        </Card>
      )}

      {page && !page.qr_code_url && page.is_published && (
        <Card>
          <CardHeader>
            <CardTitle>Generate QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateQRCode(page.id)}
              disabled={isGeneratingQR}
              className="w-full"
            >
              {isGeneratingQR && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
