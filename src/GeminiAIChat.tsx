import React, { useState, useRef, useEffect, useMemo } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkle, PaperPlane, User, Robot } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GeminiAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini AI
  const genAI = useMemo(() => {
    console.log('Initializing Gemini AI...');
    const instance = new GoogleGenerativeAI("AIzaSyC6z2xb4HrJTyoHaDbSYJVG6p1WpmVDzHE");
    console.log('Gemini AI initialized successfully');
    return instance;
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    console.log('useEffect for auto-scroll triggered, messages length:', messages.length);
    if (scrollAreaRef.current) {
      console.log('scrollAreaRef.current exists');
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        console.log('scrollContainer found, scrolling to bottom');
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else {
        console.log('scrollContainer not found');
      }
    } else {
      console.log('scrollAreaRef.current is null');
    }
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    console.log('useEffect for input focus triggered');
    if (inputRef.current) {
      console.log('inputRef.current exists, focusing');
      inputRef.current.focus();
    } else {
      console.log('inputRef.current is null');
    }
  }, []);

  const sendMessage = async () => {
    console.log('sendMessage called with inputMessage:', inputMessage);
    if (!inputMessage.trim() || isLoading) {
      console.log('sendMessage early return: inputMessage empty or isLoading true');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    console.log('Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log('Getting generative model...');
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('Model obtained, generating content...');
      const result = await model.generateContent(userMessage.content);
      console.log('Content generated, getting response...');
      const response = await result.response;
      console.log('Response obtained:', response);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text(),
        timestamp: new Date()
      };

      console.log('Adding AI message:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to Gemini AI:', error);
      console.log('Error details:', error);
      toast.error("Failed to get response from AI. Please try again.");

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('handleKeyPress called with key:', e.key, 'shiftKey:', e.shiftKey);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter pressed without shift, sending message');
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    console.log('formatTime called with date:', date);
    try {
      const formatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      console.log('formatted time:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Error';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkle className="h-5 w-5 text-primary" weight="duotone" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-dynamic-2xl">Gemini AI Assistant</h2>
          <p className="text-muted-foreground">Ask me anything about currency exchange, transactions, or general questions</p>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Robot className="h-5 w-5" weight="duotone" />
            Chat with Gemini AI
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Robot className="h-12 w-12 text-muted-foreground mx-auto mb-4" weight="duotone" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me about currency exchange rates, transaction management, or any other questions you have.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Robot className="h-4 w-4" weight="duotone" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" weight="duotone" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Robot className="h-4 w-4" weight="duotone" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Gemini is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                <PaperPlane className="h-4 w-4" weight="bold" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send • AI responses are generated by Google Gemini
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(GeminiAIChat);