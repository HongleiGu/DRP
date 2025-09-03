"use client";

import { useState, useRef, useEffect } from "react";
import { Input, Button, Card, Spin } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined, RobotFilled } from "@ant-design/icons";
import { AIMessage } from "@/types/datatypes";
import globalStore from "@/store";
import { BASE_URL } from "@/utils/utils";

interface ChatResponse {
  message: AIMessage;
  done: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // popover state

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: AIMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    const jwt = await globalStore.getItem<string>("jwt-token");
    if (!jwt) {
      console.error("cannot find jwt, have you really logged in?");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: jwt,
        },
        body: JSON.stringify({
          model: "qwen3:latest",
          provider: "ollama",
          messages: [
            { role: "system", content: "You are a helpful assistant" },
            { role: "user", content: userMessage.content },
          ],
          stream: true,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"));

        for (const line of lines) {
          const json = line.replace(/^data:\s*/, "");
          if (!json || json === "[DONE]") continue;

          const data: ChatResponse = JSON.parse(json);

          if (data.message?.content) {
            assistantMessage.content += data.message.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...assistantMessage };
              return updated;
            });
          }

          if (data.done) setIsStreaming(false);
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setIsStreaming(false);
    }
  };

  if (!isOpen) {
    // Popover/launcher before opening the chat
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<RobotFilled />}
          onClick={() => setIsOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 w-[360px] h-[500px] flex flex-col shadow-lg rounded-2xl bg-white">
      <Card className="flex-1 flex flex-col p-0 rounded-2xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && <RobotOutlined className="text-gray-500 mt-1" />}
              <div
                className={`p-3 rounded-xl max-w-[75%] whitespace-pre-wrap ${
                  msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && <UserOutlined className="text-blue-500 mt-1" />}
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Spin size="small" /> AI is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input fixed at bottom */}
        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={sendMessage}
            disabled={isStreaming}
            placeholder="Type a message..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={isStreaming}
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
