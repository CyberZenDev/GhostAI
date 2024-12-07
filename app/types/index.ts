export type ChatMode = 'software' | 'notetaking' | 'research' | 'general' | 'image';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string | {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
    };
  }[];
  images?: string[];
};

export type UploadResponse = {
  path: string;
  url: string;
};

export type MessageContent = string | {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}[]; 