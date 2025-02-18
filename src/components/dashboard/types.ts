
import { Json } from "@/integrations/supabase/types";

export interface PageContent {
  template: string;
  canvasData: Record<string, any>;
}

export interface Page {
  id: string;
  title: string;
  content: PageContent;
  is_published: boolean;
  qr_code_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  template_id: string | null;
}
