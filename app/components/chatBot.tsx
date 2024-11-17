"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

type Message = {
  content: string;
  sender: "bot" | "user";
};

type UserData = {
  username: string;
  fullName: string;
  email: string;
  role: string;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hi there! I'm ChatBot. What's your username?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const router = useRouter();

  const steps = [
    {
      question: "What's your username?",
      field: "username",
      response: (answer: string) =>
        `Nice to meet you, ${answer}! What's your full name?`,
      validate: (answer: string) => answer.length >= 3,
    },
    {
      question: "What's your full name?",
      field: "fullName",
      response: (answer: string) =>
        `Great, ${answer.split(" ")[0]}! Lastly, what's your email address?`,
      validate: (answer: string) => answer.split(" ").length >= 2,
    },
    {
      question: "What's your email address?",
      field: "email",
      response: (answer: string) =>
        `Thanks for providing your email: ${answer}. Saving your information...`,
      validate: (answer: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer),
    },
  ];

  const handleAdminLogin = async () => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAdminError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      router.push("/admin");
    } catch {
      setAdminError("Login failed");
    }
  };

  const saveUserData = async (data: UserData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          role: "user",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user data");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const currentStepData = steps[currentStep];
    if (!currentStepData.validate(input)) {
      const errorMessage: Message = {
        content: "Please provide a valid input. " + currentStepData.question,
        sender: "bot",
      };
      setMessages((prev) => [
        ...prev,
        { content: input, sender: "user" },
        errorMessage,
      ]);
      setInput("");
      return;
    }

    const userMessage: Message = { content: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const updatedUserData = {
      ...userData,
      [currentStepData.field]: input,
    };
    setUserData(updatedUserData);

    setTimeout(async () => {
      const botResponse = currentStepData.response(input);
      const botMessage: Message = { content: botResponse, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);

      if (currentStep === steps.length - 1) {
        try {
          await saveUserData(updatedUserData as UserData);
          setMessages((prev) => [
            ...prev,
            {
              content: "Your information has been saved successfully!",
              sender: "bot",
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              content:
                "Sorry, there was an error saving your information. Please try again.",
              sender: "bot",
            },
          ]);
        }
      }

      setIsTyping(false);
      setCurrentStep((prev) => prev + 1);
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="absolute top-4 right-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Admin</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <h4 className="font-medium leading-none">Admin Login</h4>
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                {adminError && (
                  <p className="text-sm text-red-500">{adminError}</p>
                )}
                <Button onClick={handleAdminLogin}>Login</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="w-full max-w-6xl mx-auto h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>ChatBot</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-end space-x-2 ${
                    message.sender === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <p className="animate-pulse">chatbot thinking...</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex space-x-2 w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit">Send</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
