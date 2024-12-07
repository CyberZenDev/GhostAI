'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Minimize2, Command, FileEdit,FolderPlus, Folder, History, LogOut, Edit, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useHotkeys } from 'react-hotkeys-hook';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from "@/types/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { ChatMode, Message, MessageContent } from "@/app/types";

type CodeProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type SuggestedPrompt = {
  mode: ChatMode;
  text: string;
};

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { mode: 'software', text: 'Explain time complexity in Big O notation' },
  { mode: 'software', text: 'What are the SOLID principles?' },
  { mode: 'notetaking', text: 'Summarize the key points from this text: ' },
  { mode: 'notetaking', text: 'Create a structured outline for: ' },
  { mode: 'research', text: 'What are the latest developments in: ' },
  { mode: 'research', text: 'Compare and contrast: ' },
  { mode: 'general', text: 'Help me understand: ' },
  { mode: 'general', text: 'Can you explain: ' },
];

const EmptyState = ({ mode }: { mode: ChatMode }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] sm:h-full text-center p-4 sm:p-8 space-y-4">
    <div className="relative">
      <img 
        src="/ghost-ai-logo.png" 
        alt="GhostAI Logo"
        className="w-12 h-12 sm:w-16 sm:h-16"
      />
    </div>
    <div className="space-y-1">
      <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
        GhostAI
      </h2>
      <p className="text-gray-500 max-w-sm text-sm">
        {mode === 'software' && 'Blazing Fast Technical Assistant'}
        {mode === 'notetaking' && 'Blazing Fast Note-Taking Assistant'}
        {mode === 'research' && 'Blazing Fast Research Assistant'}
        {mode === 'general' && 'Blazing Fast AI Assistant'}
        {mode === 'image' && 'Blazing Fast Image Generation'}
      </p>
    </div>
  </div>
);

const CollectionSelect = ({
  selectedCollectionId,
  setSelectedCollectionId,
  collections
}: {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  collections: Database['public']['Tables']['collections']['Row'][];
}) => (
  <Select
    value={selectedCollectionId || "standard"}
    onValueChange={(value) => setSelectedCollectionId(value === "standard" ? null : value)}
  >
    <SelectTrigger className="w-full h-8 px-2 text-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:bg-accent transition-colors">
      <SelectValue placeholder="Select Collection">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground/70" />
          <span className="truncate">
            {selectedCollectionId
              ? collections.find(c => c.id === selectedCollectionId)?.name
              : 'Standard Chats'}
          </span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent className="min-w-[200px]">
      <SelectItem value="standard" className="hover:bg-accent">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground/70" />
          <span className="truncate">Standard Chats</span>
        </div>
      </SelectItem>
      {collections.map((collection) => (
        <SelectItem key={collection.id} value={collection.id} className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground/70" />
            <span className="truncate">{collection.name}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

type ChatInterfaceProps = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  mode: ChatMode;
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
  handleQuickSubmit: (text: string, newMode?: ChatMode) => Promise<void>;
  isMobile: boolean;
  isMobileDialogOpen: boolean;
  setIsMobileDialogOpen: (open: boolean) => void;
  updateChatMode: (mode: ChatMode) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  isUploading: boolean;
  pastedImageUrl: string | null;
  setPastedImageUrl: (url: string | null) => void;
};

const ChatInterface = ({
  messages,
  setMessages,
  isLoading,
  input,
  setInput,
  handleSubmit,
  messagesEndRef,
  mode,
  isCommandOpen,
  setIsCommandOpen,
  handleQuickSubmit,
  isMobile,
  isMobileDialogOpen,
  setIsMobileDialogOpen,
  updateChatMode,
  handlePaste,
  isUploading,
  pastedImageUrl,
  setPastedImageUrl,
}: ChatInterfaceProps) => {
  const messageList = Array.isArray(messages) ? messages : [];

  const handleEditPrompt = (index: number) => {
    const messageToEdit = messages[index];
    if (messageToEdit.role === 'user') {
      const content = Array.isArray(messageToEdit.content) 
        ? messageToEdit.content.find(c => c.type === 'text')?.text || ''
        : messageToEdit.content;
      
      setInput(content);
      setMessages(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <main 
        className="no-scrollbar flex-1 overflow-y-auto p-2 pb-[112px] sm:pb-[80px] sm:p-4 space-y-3 sm:space-y-4 h-[calc(100dvh-104px)] sm:h-[calc(100vh-80px)] mt-[48px] sm:mt-0"
      >
        {messageList.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <div>
            {messageList.map((message, index) => (
              <div 
                key={index} 
                className="flex flex-col gap-1 mb-1"
                data-message-index={index}
              >
                <div className="flex justify-between items-center">
                  <span className="text-base text-muted-foreground ml-1">
                    {message.role === 'user' ? 'You' : 'GhostAI'}
                  </span>
                  {message.role === 'user' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditPrompt(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Card className={`w-full ${message.role === 'assistant' ? 'bg-muted' : ''}`}>
                  <CardContent className="p-2 sm:p-3 text-base break-words">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.role === 'user' ? (
                        Array.isArray(message.content) ? (
                          message.content.map((content, i) => (
                            content.type === 'text' ? content.text : 
                            content.type === 'image_url' ? <img key={i} src={content.image_url?.url} alt="Uploaded" /> : 
                            null
                          ))
                        ) : (
                          <>{message.content}</>
                        )
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ children, href }) => (
                              <a 
                                href={href} 
                                className="text-blue-500 hover:underline" 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            code: ({ inline, children, ...props }: CodeProps) => {
                              if (inline) {
                                return (
                                  <code className="bg-muted-foreground/20 rounded px-1 py-0.5" {...props}>
                                    {children}
                                  </code>
                                )
                              }
                              return (
                                <code className="inline-block text-sm" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            pre: ({ children }) => (
                              <div className="relative w-full my-3">
                                <pre className="overflow-x-auto p-2 rounded-lg bg-muted-foreground/10 text-sm">
                                  {children}
                                </pre>
                              </div>
                            ),
                            p: ({ children }) => {
                              if (React.Children.toArray(children).some(child => 
                                React.isValidElement(child) && child.type === 'img'
                              )) {
                                return <div className="my-4">{children}</div>;
                              }
                              return <p className="mb-2">{children}</p>;
                            },
                            ul: ({ children, ...props }) => (
                              <ul {...props} className="list-disc pl-4 my-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children, ...props }) => (
                              <ol {...props} className="list-decimal pl-4 my-2">
                                {children}
                              </ol>
                            ),
                            table: ({ children, ...props }) => (
                              <div className="overflow-x-auto my-4">
                                <table {...props} className="min-w-full border-collapse border border-border">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children, ...props }) => (
                              <thead {...props} className="bg-muted">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children, ...props }) => (
                              <tbody {...props} className="divide-y divide-border">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children, ...props }) => (
                              <tr {...props} className="even:bg-muted/50">
                                {children}
                              </tr>
                            ),
                            th: ({ children, ...props }) => (
                              <th {...props} className="px-4 py-2 text-left font-semibold border-r border-border last:border-r-0">
                                {children}
                              </th>
                            ),
                            td: ({ children, ...props }) => (
                              <td {...props} className="px-4 py-2 border-r border-border last:border-r-0">
                                {children}
                              </td>
                            ),
                            img: ({ src, alt }) => (
                              <img 
                                src={src} 
                                alt={alt || 'Generated image'} 
                                className="rounded-lg my-2 w-full max-w-2xl mx-auto"
                                loading="lazy"
                              />
                            ),
                          }}
                        >
                          {typeof message.content === 'string' ? message.content : ''}
                        </ReactMarkdown>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground ml-1">GhostAI</span>
            <Card className="w-full bg-muted">
              <CardContent className="p-2 sm:p-3">
                <div className="animate-pulse text-xs sm:text-sm">Thinking...</div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="sm:sticky sm:top-0 fixed bottom-[48px] sm:bottom-4 left-0 right-0 z-10 bg-background/95 backdrop-blur-md sm:border-t px-4 sm:px-2 sm:mt-1">
        <div className="max-w-4xl mx-auto">
          <div className="py-2 sm:py-4 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ModeSelector mode={mode} updateChatMode={updateChatMode} />
            </div>

            <div className="relative flex flex-col gap-2">
              {pastedImageUrl && (
                <div className="relative w-20 h-20 rounded-md overflow-hidden">
                  <img 
                    src={pastedImageUrl} 
                    alt="Pasted" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                    onClick={() => setPastedImageUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2 bg-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={pastedImageUrl ? "Ask about the image..." : "Type a message..."}
                  className="flex-1 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] focus-within:ring-blue-500/20"
                  disabled={isLoading || isUploading}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1 top-1 bottom-1 h-auto hover:bg-blue-500/10 bg-blue-500/20 text-blue-500/80 hover:text-blue-500"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </form>
            </div>

            <p className="text-base text-center text-muted-foreground hidden sm:block">
              Powered by GhostAI via Groq, Made with ❤️ by <a href="https://github.com/The-UnknownHacker" className="text-blue-500 hover:underline">The-UnknownHacker</a>
            </p>
          </div>
        </div>
      </div>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              handleQuickSubmit(input);
              setIsCommandOpen(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="sr-only">Quick Chat Command Menu</div>
          <CommandInput
            placeholder="Type a message or select a suggestion..."
            value={input}
            onValueChange={setInput}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                e.preventDefault();
                handleQuickSubmit(input);
                setIsCommandOpen(false);
              }
            }}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No suggestions found.</CommandEmpty>
            <CommandGroup heading="Suggested Prompts">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    handleQuickSubmit(prompt.text, prompt.mode);
                    setIsCommandOpen(false);
                  }}
                >
                  <div className={`w-2 h-2 rounded-full ${prompt.mode === 'software' ? 'bg-blue-500' :
                    prompt.mode === 'notetaking' ? 'bg-green-500' :
                      prompt.mode === 'research' ? 'bg-purple-500' :
                        'bg-gray-400'
                    }`}></div>
                  {prompt.text}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </form>
      </CommandDialog>

      <Button
        variant="outline"
        size="icon"
        className="sm:hidden fixed right-4 bottom-[64px] z-50 h-10 w-10 rounded-full shadow-lg bg-background border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-500"
        onClick={() => setIsMobileDialogOpen(true)}
      >
        <FileEdit className="h-4 w-4" />
      </Button>

      <Dialog open={isMobileDialogOpen} onOpenChange={setIsMobileDialogOpen}>
        <DialogContent className="w-[90%] max-w-[350px] p-4 gap-2 rounded-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">
              New Chat
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const text = formData.get('comment') as string;
              
              if (text.trim()) {
                handleQuickSubmit(text);
                setIsMobileDialogOpen(false);
              }
              
              e.currentTarget.reset();
            }}
          >
            <Input
              name="comment"
              placeholder="Type your message..."
              autoFocus
              className="flex-1"
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Send
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MobileTopBar = ({
  selectedCollectionId,
  setSelectedCollectionId,
  collections,
  chatHistories,
  selectedChatId,
  loadChat,
  deleteChat,
}: {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  collections: Database['public']['Tables']['collections']['Row'][];
  chatHistories: Database['public']['Tables']['chat_histories']['Row'][];
  selectedChatId: string | null;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
}) => (
  <div className="fixed top-0 inset-x-0 z-50 sm:hidden bg-background/95 backdrop-blur-md px-4 border-b h-[48px] flex items-center">
    <div className="max-w-4xl mx-auto w-full flex items-center gap-2">
      <CollectionSelect
        selectedCollectionId={selectedCollectionId}
        setSelectedCollectionId={setSelectedCollectionId}
        collections={collections}
      />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
          >
            <History className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          alignOffset={-8}
          className="w-80 p-0"
          sideOffset={16}
        >
          <ChatHistoriesPopover
            chatHistories={chatHistories}
            selectedChatId={selectedChatId}
            loadChat={loadChat}
            deleteChat={deleteChat}
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

// First, add this helper function at the top level
const getModeColor = (mode: ChatMode) => {
  switch (mode) {
    case 'software':
      return 'bg-blue-500';
    case 'notetaking':
      return 'bg-green-500';
    case 'research':
      return 'bg-purple-500';
    default:
      return 'bg-gray-400';
  }
};

// Add this new component near the other components at the top level
const ChatHistoriesPopover = ({
  chatHistories,
  selectedChatId,
  loadChat,
  deleteChat,
}: {
  chatHistories: Database['public']['Tables']['chat_histories']['Row'][];
  selectedChatId: string | null;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
}) => (
  <div className="w-80 flex flex-col gap-2 p-2">
    <div className="max-h-[400px] overflow-y-auto space-y-1">
      {chatHistories.map((chat) => (
        <div
          key={chat.id}
          className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-blue-500/5 transition-colors text-sm ${selectedChatId === chat.id ? 'bg-blue-500/10' : ''
            }`}
          onClick={() => loadChat(chat.id)}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${getModeColor(chat.mode as ChatMode)}`} />
          <div className="flex-1 truncate">
            {chat.title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity duration-200"
            onClick={(e) => {
              e.stopPropagation();
              deleteChat(chat.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {chatHistories.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4">
          No chat history yet
        </div>
      )}
    </div>
  </div>
);

const UserProfile = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => (
  <div className="p-2 border-t bg-muted/30">
    <div className="flex items-center gap-2 p-2">
      <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="User avatar"
            className="w-full h-full rounded-full"
          />
        ) : (
          <span className="text-sm font-medium">
            {user?.email?.[0].toUpperCase() || '?'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user?.user_metadata?.full_name || user?.email || 'Anonymous'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user?.email}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// Add this component near the other top-level components
const ModeSelector = ({ mode, updateChatMode }: { mode: ChatMode, updateChatMode: (mode: ChatMode) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getModeColor(mode)}`} />
          <span className="text-xs capitalize">{mode}</span>
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {(['general', 'software', 'notetaking', 'research', 'image'] as ChatMode[]).map((m) => (
        <DropdownMenuItem 
          key={m} 
          onClick={() => updateChatMode(m)}
          className={mode === m ? 'bg-accent' : ''}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getModeColor(m)}`} />
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </div>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// Add this at the top level, before the components
const MODE_PREPROMPTS: Record<ChatMode, string> = {
  general: "You are a helpful AI assistant.",
  software: "You are a technical expert. Provide detailed, accurate technical explanations and code examples when relevant.",
  notetaking: "You are a note-taking assistant. Help organize and structure information clearly and concisely.",
  research: "You are a research assistant. Help analyze information, find connections, and provide well-structured insights.",
  image: `You are an AI image generation assistant. Your role is to help create images using pollinations.ai.

To generate an image, create a markdown image link in this format:

![Image](https://image.pollinations.ai/prompt/{description}?width=1024&height=1024&nologo=poll&nofeed=yes&model=Flux&seed={random})

Where:
- {description} is the image description (URL encoded)
- {width} and {height} are image dimensions (default: 1024)
- {random} is a random number for variations

Example response format:
Here's your generated image based on your request:

![Image](https://image.pollinations.ai/prompt/beautiful%20sunset%20over%20mountains?width=1024&height=1024&nologo=poll&nofeed=yes&model=Flux&seed=12345)

![Image](https://image.pollinations.ai/prompt/beautiful%20sunset%20over%20mountains?width=1024&height=1024&nologo=poll&nofeed=yes&model=Flux&seed=54321)

Always generate 2 variations of each image using different seed numbers.
Keep descriptions clear and detailed but not too long.
Make sure to URL encode the descriptions.
After generating images, add: "If you'd like different variations, just ask!"
`
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('general');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatHistories, setChatHistories] = useState<Database['public']['Tables']['chat_histories']['Row'][]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [collections, setCollections] = useState<Database['public']['Tables']['collections']['Row'][]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isNewCollectionDialogOpen, setIsNewCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pastedImageUrl, setPastedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('user', user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // If no user is authenticated, redirect to auth page
    if (!user) {
      router.replace('/auth');
    }
  }, [user, router]);

  useHotkeys('meta+k, ctrl+k', (e) => {
    e.preventDefault();
    setIsCommandOpen(prev => !prev);
  }, {
    enableOnFormTags: true,
    preventDefault: true
  });

  useHotkeys('meta+e, ctrl+e', (e) => {
    e.preventDefault();
    setIsSidebarOpen(prev => !prev);
  }, {
    enableOnFormTags: true,
    preventDefault: true
  });

  const handleQuickSubmit = async (text: string, newMode?: ChatMode) => {
    if (newMode) {
      setMode(newMode);
    }
    setInput(text);
    const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
    await handleSubmit(fakeEvent);
  };

  const loadChatHistories = async () => {
    if (!user || !user.id) {
      console.error('User is not authenticated or user ID is missing');
      toast.error('Please log in to view chat histories');
      return;
    }

    try {
      let query = supabase
        .from('chat_histories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (selectedCollectionId) {
        query = query.eq('collection_id', selectedCollectionId);
      } else {
        query = query.is('collection_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const validatedHistories = data.map(history => ({
        ...history,
        messages: Array.isArray(history.messages) ? history.messages : []
      }));

      setChatHistories(validatedHistories);
    } catch (error) {
      console.error('Error loading chat histories:', error);
      toast.error('Failed to load chat histories');
    }
  };

  const deleteChat = async (id: string) => {
    const { error } = await supabase
      .from('chat_histories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
      return;
    }

    if (selectedChatId === id) {
      setSelectedChatId(null);
      setMessages([]);
    }
    loadChatHistories();
  };

  const loadChat = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_histories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading chat:', error);
        toast.error('Failed to load chat');
        return;
      }

      if (data) {
        // No need to parse messages as they are already in the correct format
        setMessages(data.messages);
        setMode(data.mode as ChatMode);
        setSelectedChatId(id);
      }
    } catch (error) {
      console.error('Error in loadChat:', error);
      toast.error('Failed to load chat');
    }
  };

  const loadCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('collections', data);

    if (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
      return;
    }

    setCollections(data);
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    const { error } = await supabase
      .from('collections')
      .insert([{
        name: newCollectionName.trim(),
        user: user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
      return;
    }

    setNewCollectionName('');
    setIsNewCollectionDialogOpen(false);
    loadCollections();
    toast.success('Collection created successfully');
  };

  useEffect(() => {
    if (user) {
      loadChatHistories();
      loadCollections();
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 640; // 640px is the 'sm' breakpoint
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsSidebarOpen(false);
      }
    };

    // Check initial screen size
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    loadChatHistories();
  }, [selectedCollectionId]);

  useEffect(() => {
    if (user && user.id) {
      loadChatHistories();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !input.trim()) return;

    // Create the message content based on whether there's a pasted image
    const newMessage = {
      role: 'user' as const,
      content: pastedImageUrl ? [
        {
          type: "image_url" as const,
          image_url: {
            url: pastedImageUrl
          }
        },
        {
          type: "text" as const,
          text: input
        }
      ] : input
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setPastedImageUrl(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: pastedImageUrl ? 
            [...messages, newMessage] : // Don't include preprompt for image messages
            [{ role: 'system', content: MODE_PREPROMPTS[mode] }, ...messages, newMessage],
          mode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: prev[prev.length - 1].content + chunk }
        ]);
      }

      const updatedMessages: Message[] = [
        ...messages,
        { role: 'user', content: input },
        { role: 'assistant', content: fullResponse }
      ];

      if (selectedChatId) {
        try {
          const { error: updateError } = await supabase
            .from('chat_histories')
            .update({
              messages: updatedMessages,
              mode,
              updated_at: new Date().toISOString(),
            })
            .eq('id', selectedChatId);

          if (updateError) throw updateError;
          setMessages(updatedMessages);
          await loadChatHistories();
        } catch (error) {
          console.error('Error updating chat:', error);
          toast.error('Failed to update chat history');
        }
      } else {
        const title = Array.isArray(input) 
          ? input.find(c => c.type === 'text')?.text?.slice(0, 50) + '...'
          : input.slice(0, 50) + (input.length > 50 ? '...' : '');

        const { data, error: insertError } = await supabase
          .from('chat_histories')
          .insert([
            {
              title,
              messages: updatedMessages,
              mode,
              collection_id: selectedCollectionId,
              user_id: user?.id
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating chat:', insertError);
          toast.error('Failed to create chat history');
        } else {
          setSelectedChatId(data.id);
          await loadChatHistories();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev.slice(0, -1), {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatMode = async (newMode: ChatMode) => {
    // Always update the UI mode immediately
    setMode(newMode);

    // If there's a selected chat, update it in the database
    if (selectedChatId) {
      console.log('updating chat mode to', newMode);

      const { error } = await supabase
        .from('chat_histories')
        .update({
          mode: newMode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedChatId);

      if (error) {
        console.error('Error updating chat mode:', error);
        toast.error('Failed to update chat mode');
        return;
      }

      await loadChatHistories();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
      return;
    }
    router.push('/auth');
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    setIsUploading(true);

    try {
      const file = imageItem.getAsFile();
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      setPastedImageUrl(url); // Store the image URL
    } catch (error) {
      console.error('Paste error:', error);
      toast.error('Failed to upload pasted image');
    } finally {
      setIsUploading(false);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <MobileTopBar
        selectedCollectionId={selectedCollectionId}
        setSelectedCollectionId={setSelectedCollectionId}
        collections={collections}
        chatHistories={chatHistories}
        selectedChatId={selectedChatId}
        loadChat={loadChat}
        deleteChat={deleteChat}
      />
      
      {/* Left Sidebar */}
      <div className={`hidden sm:block ${isSidebarOpen ? 'sm:w-64' : 'sm:w-10'} border-r bg-muted/50 transition-all duration-300 ease-in-out overflow-hidden sticky top-0 h-screen`}>
        {isSidebarOpen ? (
          <div className="flex flex-col h-full opacity-100 transition-opacity duration-300 ease-in-out">
            <div className="p-2 border-b bg-background">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20"
                  onClick={() => {
                    setSelectedChatId(null);
                    setMessages([]);
                    setMode('general');
                  }}
                >
                  <FileEdit className="mr-1 h-3 w-3" />
                  New Chat
                </Button>
                <Dialog open={isNewCollectionDialogOpen} onOpenChange={setIsNewCollectionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20"
                    >
                      <FolderPlus className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90%] max-w-[350px] p-4 gap-2 rounded-xl">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-lg">New Collection</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2">
                      <Input
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="flex-1"
                        autoFocus
                      />
                      <Button 
                        onClick={createCollection}
                        disabled={!newCollectionName.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <div className="space-y-1">
                <CollectionSelect
                  selectedCollectionId={selectedCollectionId}
                  setSelectedCollectionId={setSelectedCollectionId}
                  collections={collections}
                />
              </div>

              {chatHistories.length > 0 ? (
                <div className="opacity-100 transition-opacity duration-300 ease-in-out delay-150">
                  {chatHistories.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-blue-500/5 transition-colors ${selectedChatId === chat.id ? 'bg-blue-500/10' : ''
                        }`}
                      onClick={() => loadChat(chat.id)}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${getModeColor(chat.mode as ChatMode)}`} />
                      <div className="flex-1 truncate text-base">
                        {chat.title}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No chat history yet
                </div>
              )}
            </div>
            <UserProfile user={user} onLogout={handleLogout} />
          </div>
        ) : (
          <div className="w-10 flex flex-col items-center py-2 gap-2 opacity-100 transition-opacity duration-300 ease-in-out">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-blue-500/10 hover:text-blue-500"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <div className="flex items-center text-[10px] text-muted-foreground/70 hover:text-blue-500 transition-colors">
                      <Command className="h-2.5 w-2.5" />
                      <span className="ml-[2px]">E</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center">
                  Expand Sidebar
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedChatId(null);
                      setMessages([]);
                      setMode('general');
                    }}
                  >
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center">
                  New Chat
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={isNewCollectionDialogOpen} onOpenChange={setIsNewCollectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <FolderPlus className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] max-w-[350px] p-4 gap-2 rounded-xl">
                      <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg">New Collection</DialogTitle>
                      </DialogHeader>
                      <div className="flex gap-2">
                        <Input
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Collection name"
                          className="flex-1"
                          autoFocus
                        />
                        <Button 
                          onClick={createCollection}
                          disabled={!newCollectionName.trim()}
                        >
                          Create
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center">
                  New Collection
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <History className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      alignOffset={-8}
                      className="p-0 w-auto ml-2 relative"
                      sideOffset={16}
                    >
                      <div className="absolute left-[-6px] top-[10px] w-3 h-3 rotate-45 bg-popover border-l border-t border-border" />
                      <div className="relative">
                        <ChatHistoriesPopover
                          chatHistories={chatHistories}
                          selectedChatId={selectedChatId}
                          loadChat={loadChat}
                          deleteChat={deleteChat}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center">
                  View Chat History
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Center container for messages */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
        {/* Messages container with fixed width */}
        <div className="w-full max-w-4xl flex-shrink-0 relative">
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            messagesEndRef={messagesEndRef}
            mode={mode}
            isCommandOpen={isCommandOpen}
            setIsCommandOpen={setIsCommandOpen}
            handleQuickSubmit={handleQuickSubmit}
            isMobile={isMobile}
            isMobileDialogOpen={isMobileDialogOpen}
            setIsMobileDialogOpen={setIsMobileDialogOpen}
            updateChatMode={updateChatMode}
            handlePaste={handlePaste}
            isUploading={isUploading}
            pastedImageUrl={pastedImageUrl}
            setPastedImageUrl={setPastedImageUrl}
          />
        </div>
      </div>

      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="fixed bottom-0.5 inset-x-0 z-40 sm:hidden bg-background/95 backdrop-blur-md px-4 border-none h-[48px] flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-background border rounded-lg flex items-center justify-between gap-2 shadow-lg p-1 mb-1">
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20"
              onClick={() => {
                setSelectedChatId(null);
                setMessages([]);
                setMode('general');
              }}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              New Chat
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsNewCollectionDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>

            <ModeSelector mode={mode} updateChatMode={updateChatMode} />
          </div>
        </div>
      </div>
    </div>
  );
}