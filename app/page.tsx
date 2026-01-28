"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { FaPaperPlane, FaImage, FaTimes } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      type: imageFile ? "image" : "text",
      imageUrl: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    clearImage();
    setIsTyping(true);

    try {
      let base64Image: string | undefined;
      if (imageFile) {
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = () => resolve(reader.result as string);
        });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, imageBase64: base64Image }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          type: data.imageUrl ? "image" : "text",
          imageUrl: data.imageUrl,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: "err", role: "assistant", content: "Error connecting to AI." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatApp}>
      <div className={styles.chatWindow} ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.role === "user" ? styles.userMsg : styles.assistantMsg
            }`}
          >
            {msg.imageUrl && (
              <div className={styles.imageWrapper}>
                <img src={msg.imageUrl} alt="chat" className={styles.chatImage} />
              </div>
            )}

            {msg.content && msg.type !== "image" && (
              <div className={styles.textBubble}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  children={msg.content}
                />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.assistantMsg}`}>
            <div className={styles.textBubble}>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
              <span className={styles.typingDot}></span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        {imagePreview && (
          <div className={styles.previewContainer}>
            <img src={imagePreview} className={styles.previewImage} alt="preview" />
            <button onClick={clearImage} className={styles.removePreview}>
              <FaTimes />
            </button>
          </div>
        )}

        <label className={styles.imageLabel}>
          <FaImage size={20} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.fileInput}
          />
        </label>

        <input
          type="text"
          placeholder="Ask any Beam Analysis question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className={styles.textField}
        />

        <button className={styles.sendBtn} onClick={handleSend}>
          <FaPaperPlane size={16} />
        </button>
      </div>
    </div>
  );
}
