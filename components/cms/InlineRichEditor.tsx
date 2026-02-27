"use client";

import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";

interface InlineRichEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
}

export function InlineRichEditor({ value, onChange }: InlineRichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
    ],
    content: value,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] rounded border border-[var(--db-border)] bg-white px-3 py-2 text-[16px] leading-7 text-[#1f2a22] focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const toolbarButton = (label: string, onClick: () => void, active = false) => (
    <button
      type="button"
      key={label}
      onClick={onClick}
      className={`rounded border px-2 py-1 text-xs font-semibold ${
        active
          ? "border-[#173724] bg-[#173724] text-white"
          : "border-[var(--db-border)] bg-white text-[#173724] hover:bg-[#eef4ec]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {toolbarButton("P", () => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph"))}
        {toolbarButton("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {toolbarButton("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        {toolbarButton("Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {toolbarButton("Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {toolbarButton("Bullet", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {toolbarButton("Number", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {toolbarButton("Link", setLink, editor.isActive("link"))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
