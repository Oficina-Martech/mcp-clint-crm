// Clint API response types

export interface ClintApiError {
  status?: number;
  message?: string;
  error?: string;
}

export interface ClintPaginatedV1<T> {
  status: number;
  totalCount: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  data: T[];
}

export interface ClintPaginatedV2<T> {
  status: number;
  total_count: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  data: T[];
}

export interface ClintSingleResponse<T> {
  status: number;
  data: T;
}

// Tag color enum (Material colors)
export const TAG_COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#faa200",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

// Deal status enum
export const DEAL_STATUSES = ["OPEN", "WON", "LOST"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

// Channel account status
export const CHANNEL_STATUSES = [
  "CONNECTED",
  "DISCONNECTED",
  "CANCELLED",
] as const;
export type ChannelStatus = (typeof CHANNEL_STATUSES)[number];

// Chat status
export const CHAT_STATUSES = [
  "OPEN",
  "CLOSED",
  "WAITING",
  "SNOOZED",
  "REOPENED",
] as const;
export type ChatStatus = (typeof CHAT_STATUSES)[number];

// Message template approval status
export const TEMPLATE_STATUSES = ["APPROVED", "PENDING", "REJECTED"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

// Domain types

export interface ClintTag {
  id: string;
  name: string;
  color?: string;
}

export interface ClintUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export interface ClintGroup {
  id: string;
  name: string;
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface ClintLostStatus {
  id: string;
  name: string;
}

export interface ClintStage {
  id: string;
  label: string;
  order: number;
  type: string;
}

export interface ClintOrigin {
  id: string;
  name: string;
  group?: { id: string; name: string };
  stages?: ClintStage[];
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface ClintOrganization {
  id: string;
  name?: string | null;
  fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ClintContact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ddi?: string;
  fullPhone?: string;
  username?: string;
  organization?: ClintOrganization | null;
  instagram?: { username: string } | string | null;
  tags?: ClintTag[];
  fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ClintDealContact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ddi?: string;
  instagram?: string | null;
}

export interface ClintDeal {
  id: string;
  origin_id: string;
  user?: { id: string; email?: string; full_name?: string };
  contact?: ClintDealContact;
  created_at: string;
  updated_at?: string;
  stage_id: string;
  stage?: string;
  updated_stage_at?: string;
  status: DealStatus;
  value?: number;
  won_at?: string | null;
  won_by?: string | null;
  lost_status_id?: string | null;
  lost_at?: string | null;
  lost_by?: string | null;
  fields?: Record<string, unknown>;
  contact_schedules?: unknown[];
}

export interface ClintContactAttachment {
  id: string;
  contact_id: string;
  created_at: string;
  updated_at?: string;
  uploaded_by?: { id: string; first_name?: string; last_name?: string };
  document?: {
    id: string;
    name: string;
    file_name: string;
    url: string;
    extension: string;
    file_size: number;
  };
}

export interface ClintChannelAccount {
  id: string;
  created_at?: string;
  name: string;
  status: ChannelStatus;
  avatar?: string | null;
  identifier?: string | null;
  team_id?: string | null;
  team?: { id: string; name: string };
}

export interface ClintMessageTemplate {
  id: string;
  external_id?: string;
  name: string;
  status: TemplateStatus;
  language: string;
  category: string;
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    text?: string;
    format?: string;
  }>;
}

export interface ClintChat {
  id: string;
  created_at: string;
  contact_id: string;
  user_id?: string | null;
  status: ChatStatus;
  seen?: boolean;
  unread?: boolean;
  replied?: boolean;
  unseen_count?: number;
  last_message_at?: string;
  last_response_at?: string | null;
  last_status_at?: string | null;
  first_response_at?: string | null;
  channel_account_id: string;
  team_id?: string | null;
}

export interface ClintMessage {
  id: string;
  created_at: string;
  chat_id?: string | null;
  user_id?: string | null;
  content: string;
  type: "USER" | "CUSTOMER" | "EVENT" | "NOTE";
  sent?: boolean;
  seen?: boolean;
  delivered?: boolean;
  content_type?: string;
  content_url?: string | null;
  external_id?: string | null;
  status?: string;
}

export interface ClintDashboardSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  charts_count: number;
}

export interface ClintDashboardDetail {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  charts: Array<Record<string, unknown>>;
}
