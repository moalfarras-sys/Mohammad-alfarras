import { createSupabaseAdminClient } from "@/lib/supabase/client";
import type { AiConversationRow } from "@/lib/ai-ops";
import type { AppSupportRequest } from "@/types/app-ecosystem";
import type { WebsiteContactMessage } from "@/lib/website-cms";

export type EmailInboxData = {
  websiteMessages: WebsiteContactMessage[];
  appMessages: Array<AppSupportRequest & { productName: string }>;
  aiConversations: AiConversationRow[];
};

export async function readEmailInboxData(): Promise<EmailInboxData> {
  const supabase = createSupabaseAdminClient();
  const [websiteRes, appRes, conversationsRes, messagesRes] = await Promise.all([
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("app_support_requests").select("*").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("ai_conversations")
      .select("id,locale,channel,page_path,status,intent,summary,lead_score,created_at,updated_at,visitor_email")
      .not("visitor_email", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase.from("ai_messages").select("id,conversation_id,role,content,created_at").order("created_at", { ascending: true }).limit(200),
  ]);

  const messages = ((messagesRes.data ?? []) as Array<AiConversationRow["messages"][number] & { conversation_id: string }>).reduce(
    (map, message) => {
      const current = map.get(message.conversation_id) ?? [];
      current.push({ id: message.id, role: message.role, content: message.content, created_at: message.created_at });
      map.set(message.conversation_id, current);
      return map;
    },
    new Map<string, AiConversationRow["messages"]>(),
  );

  return {
    websiteMessages: (websiteRes.data ?? []) as WebsiteContactMessage[],
    appMessages: ((appRes.data ?? []) as AppSupportRequest[]).map((message) => ({
      ...message,
      productName: message.product_slug === "moplayer2" ? "MoPlayer Pro" : "MoPlayer",
    })),
    aiConversations: ((conversationsRes.data ?? []) as Omit<AiConversationRow, "messages">[])
      .filter((conversation) => Boolean(conversation.visitor_email))
      .map((conversation) => ({ ...conversation, messages: messages.get(conversation.id) ?? [] })),
  };
}
