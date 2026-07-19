import React, { useState, useRef } from "react";
import { Icon } from "../ui/Icon";

const MessageInput = ({ onSendMessage, sending }) => {
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
      className="p-4 bg-white dark:bg-[#18181B] border-t border-zinc-100 dark:border-[#18181B] flex-shrink-0 relative z-20 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Панель прикрепленного файла */}
        {selectedFile && (
          <div className="flex items-center gap-3 p-2.5 bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-100 dark:border-zinc-800/60 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-3xs">
            {filePreview ? (
              <div className="relative group overflow-hidden w-12 h-12 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shadow-2xs">
                <img 
                  src={filePreview} 
                  alt="Превью" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#E11D48]/10 dark:bg-[#E11D48]/5 text-[#E11D48] border border-[#E11D48]/20 flex items-center justify-center shrink-0 shadow-3xs">
                <Icon name="file" className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold font-mono mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearAttachment}
              className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-[#E11D48] hover:bg-[#E11D48]/10 active:scale-95 transition-all cursor-pointer"
              title="Удалить файл"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Основное поле ввода */}
        <div className="flex items-center gap-2 bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200/60 dark:border-zinc-800/80 p-1.5 rounded-2xl focus-within:border-[#E11D48]/40 focus-within:ring-2 focus-within:ring-[#E11D48]/10 focus-within:bg-white dark:focus-within:bg-[#09090B] transition-all duration-200 shadow-3xs">
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
            className="h-9 w-9 shrink-0 grid place-items-center text-zinc-400 dark:text-zinc-500 hover:text-[#E11D48] hover:bg-[#E11D48]/10 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Прикрепить файл или фото"
          >
            <Icon name="paperclip" className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedFile ? "Добавьте подпись..." : "Напишите сообщение..."}
            className="min-w-0 flex-1 text-xs font-medium bg-transparent outline-none px-2 py-2 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || sending}
            className="h-9 w-9 shrink-0 grid place-items-center bg-gradient-to-b from-[#E11D48] to-[#BE123C] hover:opacity-95 disabled:from-zinc-100 disabled:to-zinc-100 dark:disabled:from-zinc-800/40 dark:disabled:to-zinc-800/40 text-white disabled:text-zinc-400 dark:disabled:text-zinc-600 rounded-xl transition-all active:scale-95 shadow-sm shadow-[#E11D48]/10 disabled:shadow-none cursor-pointer"
            aria-label="Отправить сообщение"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon name="send" className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;