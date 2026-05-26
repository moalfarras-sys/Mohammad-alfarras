import { createSupabaseAdminClient } from "@/lib/supabase/client";

export type AiConversationRow = {
  id: string;
  locale: string | null;
  channel: string | null;
  page_path: string | null;
  status: string | null;
  intent: string | null;
  summary: string | null;
  lead_score: number | null;
  created_at: string;
  updated_at: string | null;
  visitor_email: string | null;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
};

export type AiFeedbackRow = {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
};

export type AutomationEventRow = {
  id: string;
  event_type: string | null;
  source: string | null;
  product_slug: string | null;
  subject_type: string | null;
  subject_id: string | null;
  priority: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  processed_at: string | null;
};

export type AssistantEventRow = {
  key: string;
  updated_at: string;
  value: {
    locale?: string;
    message?: string;
    provider?: string;
    fallback?: boolean;
    retentionDays?: number;
    createdAt?: string;
  } | null;
};

export type AutomationInboxRow = {
  id: string;
  event_id: string | null;
  run_id: string | null;
  product_slug: string | null;
  title: string;
  body: string;
  severity: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
};

export type AutomationRunRow = {
  id: string;
  event_id: string | null;
  workflow_key: string;
  workflow_name: string | null;
  status: string | null;
  n8n_execution_id: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AutomationRuleRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean | null;
  workflow_key: string;
  event_types: string[] | null;
  updated_at: string | null;
};

export type AiOpsData = {
  conversations: AiConversationRow[];
  feedback: AiFeedbackRow[];
  automationEvents: AutomationEventRow[];
  automationInbox: AutomationInboxRow[];
  automationRuns: AutomationRunRow[];
  automationRules: AutomationRuleRow[];
  assistantEvents: AssistantEventRow[];
  settings: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    gemini_model?: string;
    updated_at?: string;
  } | null;
};

export async function readAiOpsData(): Promise<AiOpsData> {
  const supabase = createSupabaseAdminClient();
  const [conversationsRes, messagesRes, feedbackRes, automationRes, inboxRes, runsRes, rulesRes, eventsRes, settingsRes] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("id,locale,channel,page_path,status,intent,summary,lead_score,created_at,updated_at,visitor_email")
      .order("updated_at", { ascending: false })
      .limit(18),
    supabase
      .from("ai_messages")
      .select("id,conversation_id,role,content,created_at")
      .order("created_at", { ascending: true })
      .limit(120),
    supabase
      .from("ai_feedback")
      .select("id,conversation_id,message_id,rating,comment,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("automation_events")
      .select("id,event_type,source,product_slug,subject_type,subject_id,priority,status,error_message,created_at,sent_at,processed_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("automation_inbox")
      .select("id,event_id,run_id,product_slug,title,body,severity,status,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("automation_runs")
      .select("id,event_id,workflow_key,workflow_name,status,n8n_execution_id,error_message,started_at,finished_at")
      .order("started_at", { ascending: false })
      .limit(30),
    supabase
      .from("automation_rules")
      .select("id,key,label,description,enabled,workflow_key,event_types,updated_at")
      .order("key", { ascending: true })
      .limit(40),
    supabase
      .from("app_settings")
      .select("key,value,updated_at")
      .like("key", "site_assistant_event:%")
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("ai_assistant_settings")
      .select("enabled,provider,model,gemini_model,updated_at")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  const messages = ((messagesRes.data ?? []) as Array<AiConversationRow["messages"][number] & { conversation_id: string }>).reduce(
    (map, message) => {
      const current = map.get(message.conversation_id) ?? [];
      current.push({
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
      });
      map.set(message.conversation_id, current);
      return map;
    },
    new Map<string, AiConversationRow["messages"]>(),
  );

  return {
    conversations: ((conversationsRes.data ?? []) as Omit<AiConversationRow, "messages">[]).map((conversation) => ({
      ...conversation,
      messages: messages.get(conversation.id) ?? [],
    })),
    feedback: (feedbackRes.data ?? []) as AiFeedbackRow[],
    automationEvents: (automationRes.data ?? []) as AutomationEventRow[],
    automationInbox: (inboxRes.data ?? []) as AutomationInboxRow[],
    automationRuns: (runsRes.data ?? []) as AutomationRunRow[],
    automationRules: (rulesRes.data ?? []) as AutomationRuleRow[],
    assistantEvents: (eventsRes.data ?? []) as AssistantEventRow[],
    settings: (settingsRes.data ?? null) as AiOpsData["settings"],
  };
}

export async function updateAiConversationStatus(id: string, status: "open" | "reviewed" | "archived") {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("ai_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAiConversation(id: string) {
  const supabase = createSupabaseAdminClient();
  const deleteFeedback = await supabase.from("ai_feedback").delete().eq("conversation_id", id);
  if (deleteFeedback.error) throw deleteFeedback.error;
  const deleteMessages = await supabase.from("ai_messages").delete().eq("conversation_id", id);
  if (deleteMessages.error) throw deleteMessages.error;
  const deleteConversation = await supabase.from("ai_conversations").delete().eq("id", id);
  if (deleteConversation.error) throw deleteConversation.error;
}

export async function deleteAiFeedback(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("ai_feedback").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAutomationEventStatus(id: string, status: "queued" | "sent" | "processed" | "failed" | "ignored") {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("automation_events").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateAutomationInboxStatus(id: string, status: "new" | "reviewing" | "approved" | "resolved" | "archived") {
  const supabase = createSupabaseAdminClient();
  const payload: Record<string, string> = { status };
  if (status === "resolved") payload.resolved_at = new Date().toISOString();
  if (status === "reviewing" || status === "approved") payload.reviewed_at = new Date().toISOString();
  const { error } = await supabase.from("automation_inbox").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateAutomationRuleEnabled(id: string, enabled: boolean) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("automation_rules").update({ enabled, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteAssistantEvent(key: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_settings").delete().eq("key", key).like("key", "site_assistant_event:%");
  if (error) throw error;
}
