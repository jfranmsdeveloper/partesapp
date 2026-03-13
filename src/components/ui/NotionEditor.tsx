import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState } from "react";

interface NotionEditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const NotionEditor = ({
  initialContent,
  onChange,
  placeholder,
}: NotionEditorProps) => {
  // Initialize the editor
  const editor = useCreateBlockNote({
    initialContent: undefined, // Content will be set via HTML conversion if needed
  });

  const [isReady, setIsReady] = useState(false);

  // Effect to load initial HTML content if provided
  useEffect(() => {
    const loadInitialContent = async () => {
      if (initialContent && editor) {
        try {
          // If it looks like HTML, convert it. Otherwise treat as text/markdown
          if (initialContent.startsWith("<")) {
            const blocks = await editor.tryParseHTMLToBlocks(initialContent);
            editor.replaceBlocks(editor.document, blocks);
          } else if (initialContent) {
            const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
            editor.replaceBlocks(editor.document, blocks);
          }
        } catch (e) {
          console.error("Failed to parse initial content in NotionEditor", e);
        }
      }
      setIsReady(true);
    };

    loadInitialContent();
  }, [editor]); // Run once when editor is created

  // Listen for changes and export as HTML
  const handleChange = async () => {
    if (editor) {
      const html = await editor.blocksToFullHTML(editor.document);
      onChange(html);
    }
  };

  if (!isReady) return <div className="p-4 text-slate-400">Cargando editor...</div>;

  return (
    <div className="notion-editor-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[300px]">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light" // Can be made dynamic if needed
        className="min-h-[300px]"
        data-placeholder={placeholder}
      />
    </div>
  );
};
