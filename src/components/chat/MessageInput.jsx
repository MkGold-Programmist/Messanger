import React, { useState } from "react";
import { Icon } from "../ui/Icon";

export const MessageInput = ({ onSendMessage, sending }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || sending) return;

    onSendMessage(cleanText);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex-shrink-0"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 p-1 rounded-xl focus-within:border-brand-red/30 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all duration-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите сообщение..."
          className="min-w-0 flex-1 text-xs bg-transparent outline-none px-2 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="h-8 w-8 shrink-0 grid place-items-center bg-brand-red hover:bg-rose-600 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 text-white rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer"
          aria-label="Отправить сообщение"
        >
          <Icon name="send" className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};