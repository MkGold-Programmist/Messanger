import React, { useState, useRef } from "react";
import { Icon } from "../ui/Icon";

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
      className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0 relative z-20"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {selectedFile && (
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            {filePreview ? (
              <img 
                src={filePreview} 
                alt="Превью" 
                className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-rose-500/10 dark:bg-rose-500/5 text-brand-red border border-rose-500/20 flex items-center justify-center">
                <Icon name="file" className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearAttachment}
              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 p-1.5 rounded-xl focus-within:border-brand-red/30 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all duration-200 shadow-xs">
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
            className="h-9 w-9 shrink-0 grid place-items-center text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 rounded-lg transition-all active:scale-95 cursor-pointer"
            title="Прикрепить файл или фото"
          >
            <Icon name="paperclip" className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedFile ? "Добавьте подпись..." : "Напишите сообщение..."}
            className="min-w-0 flex-1 text-sm bg-transparent outline-none px-2 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || sending}
            className="h-9 w-9 shrink-0 grid place-items-center bg-brand-red hover:bg-rose-600 disabled:bg-slate-100 dark:disabled:bg-zinc-800/60 disabled:text-slate-400 dark:disabled:text-zinc-600 text-white rounded-lg transition-all active:scale-95 shadow-sm shadow-brand-red/10 cursor-pointer"
            aria-label="Отправить сообщение"
          >
            <Icon name="send" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};