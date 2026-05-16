"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState(value);

  useEffect(() => {
    if (value !== content && editorRef.current && editorRef.current.innerHTML !== value) {
      setContent(value);
      editorRef.current.innerHTML = value;
    }
  }, [value, content]);

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setContent(newHtml);
      onChange(newHtml);
    }
  };

  const handleCommand = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  };

  const preventSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[1.4rem] border transition-colors",
        isFocused ? "border-amber-300" : "border-white/10",
        "bg-white/6",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-black/20 p-2">
        <button
          type="button"
          onMouseDown={preventSubmit}
          onClick={() => handleCommand("bold")}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventSubmit}
          onClick={() => handleCommand("italic")}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          onMouseDown={preventSubmit}
          onClick={() => handleCommand("insertUnorderedList")}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={preventSubmit}
          onClick={() => handleCommand("insertOrderedList")}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="rich-text-input min-h-[150px] w-full p-4 text-sm text-stone-100 outline-none"
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
