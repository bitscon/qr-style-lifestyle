
import { Canvas } from "fabric";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeaderForm } from "./PageHeaderForm";
import { PageEditorTabs } from "./PageEditorTabs";
import { Page, PageContent } from "./types";

interface PageEditorFormProps {
  page: Page | null;
  title: string;
  setTitle: (title: string) => void;
  isPublished: boolean;
  setIsPublished: (isPublished: boolean) => void;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setCanvas: (canvas: Canvas | null) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isEdit: boolean;
}

export function PageEditorForm({
  page,
  title,
  setTitle,
  isPublished,
  setIsPublished,
  selectedTemplate,
  setSelectedTemplate,
  activeTab,
  setActiveTab,
  setCanvas,
  onCancel,
  onSubmit,
  isPending,
  isEdit,
}: PageEditorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
          {page && (
            <PageEditorTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCanvasReady={setCanvas}
              initialCanvasData={page.content?.canvasData || null}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEdit
              ? "Update Page"
              : "Create Page"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
