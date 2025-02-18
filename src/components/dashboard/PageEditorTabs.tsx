
import { Canvas } from "fabric";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CanvasEditor } from "./CanvasEditor";

interface PageEditorTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCanvasReady: (canvas: Canvas) => void;
  initialCanvasData?: Record<string, any>;
}

export function PageEditorTabs({
  activeTab,
  setActiveTab,
  onCanvasReady,
  initialCanvasData,
}: PageEditorTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="editor">Visual Editor</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="editor">
        <CanvasEditor onCanvasReady={onCanvasReady} initialData={initialCanvasData} />
      </TabsContent>
      <TabsContent value="preview">
        <div className="border rounded-lg p-4 min-h-[600px]">
          Preview content will be shown here
        </div>
      </TabsContent>
    </Tabs>
  );
}
