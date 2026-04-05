"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ApiErrorMessage from "./api-error-message";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Bot, User, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

type TemplatePrompt = {
  id: string;
  title: string;
  prompt: string;
  category: "savings" | "budgeting" | "investing" | "general";
};

const GREETING: Message = {
  id: "greeting",
  content:
    "Hello! I'm your CoopWise AI assistant. How can I help you with your savings and financial goals today?",
  role: "assistant",
  timestamp: new Date(),
};

const templatePrompts: TemplatePrompt[] = [
  {
    id: "budget-plan",
    title: "Create a budget plan",
    prompt:
      "Can you help me create a monthly budget plan based on an income of ₦150,000?",
    category: "budgeting",
  },
  {
    id: "savings-goal",
    title: "Savings goal strategy",
    prompt: "What strategy should I use to save ₦500,000 in 6 months?",
    category: "savings",
  },
  {
    id: "expense-reduce",
    title: "Reduce expenses",
    prompt: "What are 5 practical ways I can reduce my daily expenses?",
    category: "budgeting",
  },
  {
    id: "investment-start",
    title: "Start investing",
    prompt:
      "I have ₦100,000 saved. What are some safe investment options for beginners?",
    category: "investing",
  },
  {
    id: "emergency-fund",
    title: "Emergency fund",
    prompt:
      "How much should I have in my emergency fund and how can I build it quickly?",
    category: "savings",
  },
  {
    id: "debt-strategy",
    title: "Debt payment strategy",
    prompt:
      "What's the best strategy to pay off multiple debts with limited income?",
    category: "general",
  },
];

function mapStoredToMessages(
  rows: Array<{ role: string; content: string; ts?: string }>
): Message[] {
  const out: Message[] = [];
  for (const m of rows) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const ts = m.ts ? new Date(m.ts) : new Date();
    out.push({
      id: `${m.ts ?? out.length}-${m.role}`,
      role: m.role,
      content: m.content,
      timestamp: ts,
    });
  }
  return out;
}

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [historyReady, setHistoryReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const { aiService } = await import("@/services/ai-service");
      const stored = await aiService.fetchChatHistory();
      const mapped = mapStoredToMessages(stored);
      setMessages(mapped.length > 0 ? mapped : [GREETING]);
    } catch {
      setMessages([GREETING]);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (historyReady && inputRef.current) {
      inputRef.current.focus();
    }
  }, [historyReady]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setApiError(null);

    try {
      const { aiService } = await import("@/services/ai-service");
      const aiResponseText = await aiService.sendMessage(userMessage.content);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setApiError(
        "Failed to connect to the AI service. Please try again later."
      );
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I encountered an error processing your request. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const filteredPrompts =
    selectedCategory === "all"
      ? templatePrompts
      : templatePrompts.filter((p) => p.category === selectedCategory);

  const handleRetry = () => {
    setApiError(null);
    if (
      messages.length > 1 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      setMessages(messages.slice(0, -1));
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      {apiError ? (
        <ApiErrorMessage message={apiError} onRetry={handleRetry} />
      ) : (
        <Card className="flex h-full min-h-0 w-full flex-1 flex-col rounded-none border-none shadow-none">
          <CardHeader className="flex-shrink-0 pb-2 pt-2 sm:pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Savings Assistant</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 px-2"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { aiService } = await import("@/services/ai-service");
                    await aiService.resetChat();
                    setMessages([{ ...GREETING, timestamp: new Date() }]);
                  } catch (e) {
                    console.error("Error resetting chat:", e);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                <span className="text-xs">New Chat</span>
              </Button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {(
                [
                  "all",
                  "savings",
                  "budgeting",
                  "investing",
                  "general",
                ] as const
              ).map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <div className="min-h-0 flex-1 overflow-hidden px-1 sm:px-2">
            <ScrollArea className="h-[min(100%,520px)] max-h-[calc(100dvh-14rem)] min-h-[200px] sm:h-[calc(100dvh-13rem)] sm:max-h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-10rem)] lg:max-h-none">
              <div className="space-y-3 pr-3 pb-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[min(92vw,640px)] gap-3 ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {message.role === "user" ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                        ) : (
                          <div className="ai-message-content text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div
                          className={`mt-1 text-xs ${
                            message.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[85%] gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-600"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-600"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-600"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur sm:px-3">
            <p className="mb-1 text-xs text-muted-foreground">Suggested prompts:</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {filteredPrompts.slice(0, 3).map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1 text-xs"
                  type="button"
                  onClick={() => handlePromptSelect(prompt.prompt)}
                >
                  {prompt.title}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto py-1 text-xs"
                onClick={() => {
                  const randomPrompt =
                    templatePrompts[
                      Math.floor(Math.random() * templatePrompts.length)
                    ];
                  handlePromptSelect(randomPrompt.prompt);
                }}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Random
              </Button>
            </div>

            <CardFooter className="px-0 pb-2 pt-0">
              <div className="relative flex w-full flex-col">
                <Textarea
                  ref={inputRef}
                  placeholder="Ask about savings, budgeting, or financial advice..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] w-full resize-none rounded-md border pr-12"
                  maxLength={500}
                  rows={2}
                />
                <Button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                  className="absolute bottom-2 right-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {inputValue.length}/500
                </div>
              </div>
            </CardFooter>
          </div>
        </Card>
      )}
    </div>
  );
}
