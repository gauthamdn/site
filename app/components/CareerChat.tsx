"use client";

import {
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage: Message = {
  role: "assistant",
  content:
    "Hi—I’m Gautham’s AI career twin. Ask me about his leadership journey, engineering experience, or the outcomes his teams have delivered.",
};

const suggestions = [
  "What is Gautham’s leadership style?",
  "What impact did he make at Dell?",
  "Why would he be a strong engineering leader?",
];

export default function CareerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length === 1) inputRef.current?.focus();
  }, [isOpen, messages, isLoading]);

  async function sendMessage(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmedQuestion,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(1),
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok || !data.answer) {
        throw new Error(data.error || "No answer was returned.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer as string },
      ]);
    } catch (error) {
      console.error("Career chat failed:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I’m having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <aside className="career-chat" aria-label="AI career twin">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-identity">
              <span className="chat-avatar">
                <Bot size={19} />
              </span>
              <div>
                <strong>Gautham&apos;s digital twin</strong>
                <span>
                  <i /> AI career guide
                </span>
              </div>
            </div>
            <button
              className="chat-close"
              type="button"
              aria-label="Close career chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={19} />
            </button>
          </div>

          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`chat-message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.role === "assistant" && (
                  <span className="message-icon">
                    <Sparkles size={13} />
                  </span>
                )}
                <p>{message.content}</p>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="chat-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="chat-message assistant loading">
                <span className="message-icon">
                  <LoaderCircle size={14} />
                </span>
                <p>Thinking through the career story…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Gautham’s career…"
              rows={1}
              maxLength={2000}
              aria-label="Ask a career question"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={isLoading || !input.trim()}
            >
              <Send size={17} />
            </button>
          </form>
          <p className="chat-disclaimer">
            AI-generated answers based on Gautham&apos;s professional profile.
          </p>
        </div>
      )}

      <button
        className={isOpen ? "chat-launcher active" : "chat-launcher"}
        type="button"
        aria-label={isOpen ? "Close AI career twin" : "Chat with my AI career twin"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={21} />}
        {!isOpen && (
          <span>
            Ask my <strong>digital twin</strong>
          </span>
        )}
      </button>
    </aside>
  );
}
