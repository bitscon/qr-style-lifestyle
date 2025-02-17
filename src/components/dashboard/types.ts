
import { Json } from "@/integrations/supabase/types";

export interface PageContent {
  template: string;
  canvasData: Record<string, Json>;
}

export interface Page {
  id: string;
  title: string;
  content: PageContent;
  is_published: boolean;
  qr_code_url?: string;
  user_id: string;
}
