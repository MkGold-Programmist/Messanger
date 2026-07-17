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
      className="p-3 sm:p-4 bg-white/70 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-900 backdrop-blur-md"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-1.5 rounded-xl shadow-sm focus-within:border-brand-red/50 transition-all">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите сообщение..."
          className="min-w-0 flex-1 text-sm bg-transparent outline-none px-2 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="h-9 w-9 grid place-items-center bg-brand-red text-white hover:bg-brand-redHover disabled:bg-slate-300 dark:disabled:bg-zinc-800 rounded-lg transition-all active:scale-95 shadow-md shadow-brand-red/10"
          aria-label="Отправить сообщение"
        >
          <Icon name="send" />
        </button>
      </div>
    </form>
  );
};
