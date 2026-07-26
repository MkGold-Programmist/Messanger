import React, { useState, useRef } from "react";

export const MessageInput = ({ onSendMessage, sending }) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview("");
    }
  };

  const clearAttachment = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !selectedFile) || sending) return;

    onSendMessage(cleanText, selectedFile);
    setText("");
    clearAttachment();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 flex-shrink-0 relative z-20 transition-all"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {selectedFile && (
          <div className="flex items-center gap-3 p-2 pl-3 bg-zinc-50/90 dark:bg-[#18181B]/90 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-xs">
            {filePreview ? (
              <div className="relative group overflow-hidden w-11 h-11 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs shrink-0">
                <img
                  src={filePreview}
                  alt="Превью"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium font-mono mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearAttachment}
              className="p-2 rounded-xl text-zinc-400 hover:text-[#E11D48] hover:bg-[#E11D48]/10 active:scale-90 transition-all cursor-pointer"
              title="Удалить файл"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-zinc-100/70 dark:bg-[#18181B]/80 border border-zinc-200/50 dark:border-zinc-800/80 p-1.5 pl-2.5 rounded-2xl focus-within:border-[#E11D48]/40 focus-within:ring-4 focus-within:ring-[#E11D48]/5 focus-within:bg-white dark:focus-within:bg-[#121215] transition-all duration-300 shadow-inner">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 shrink-0 grid place-items-center text-zinc-400 dark:text-zinc-500 hover:text-[#E11D48] hover:bg-[#E11D48]/10 rounded-xl transition-all active:scale-90 cursor-pointer"
            title="Прикрепить файл или фото"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedFile ? "Добавьте подпись..." : "Напишите сообщение..."}
            className="min-w-0 flex-1 text-xs sm:text-sm font-medium bg-transparent outline-none px-2 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || sending}
            className="h-9 w-9 shrink-0 grid place-items-center bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100 text-white rounded-xl transition-all shadow-md shadow-[#E11D48]/25 disabled:shadow-none cursor-pointer"
            aria-label="Отправить сообщение"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;