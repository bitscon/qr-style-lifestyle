
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "fabric";
import { useAuth } from "@/contexts/AuthContext";
import { usePageQuery } from "./hooks/usePageQuery";
import { usePageMutation } from "./hooks/usePageMutation";
import { PageEditorForm } from "./PageEditorForm";
import { QRCodeSection } from "./QRCodeSection";
import { PageContent } from "./types";

export function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTab, setActiveTab] = useState("editor");

  const { data: page, isLoading } = usePageQuery(id);
  const mutation = usePageMutation(id, user);

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
      <PageEditorForm
        page={page}
        title={title}
        setTitle={setTitle}
        isPublished={isPublished}
        setIsPublished={setIsPublished}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCanvas={setCanvas}
        onCancel={() => navigate("/dashboard/pages")}
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        isEdit={!!id}
      />

      <QRCodeSection page={page} />
    </div>
  );
}
