
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageHeaderFormProps {
  title: string;
  setTitle: (title: string) => void;
  isPublished: boolean;
  setIsPublished: (isPublished: boolean) => void;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
}

export function PageHeaderForm({
  title,
  setTitle,
  isPublished,
  setIsPublished,
  selectedTemplate,
  setSelectedTemplate,
}: PageHeaderFormProps) {
  return (
    <>
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
    </>
  );
}
