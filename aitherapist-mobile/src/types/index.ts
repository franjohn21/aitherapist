export type SessionType =
  | "quickCalming"
  | "guidedMeditation"
  | "specificConcern"
  | "affirmations";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  audioContent?: string; // Base64 encoded audio content
}

export interface ChatResponse {
  response: string;
  audioContent?: string;
  error?: string;
}
