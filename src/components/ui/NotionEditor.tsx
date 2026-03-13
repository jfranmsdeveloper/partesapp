import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs, createCodeBlockSpec } from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";

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
  // 1. Define custom schema to include advanced CodeBlock options
  // This enables syntax highlighting and more languages (SQL, JSON, etc.)
  const schema = useMemo(() => {
    return BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        codeBlock: createCodeBlockSpec({
          ...codeBlockOptions,
          // We can override default settings here if needed
        }),
      },
    });
  }, []);

  // 2. Initialize the editor with the custom schema
  const editor = useCreateBlockNote({
    schema,
    initialContent: undefined,
  });

  const [isReady, setIsReady] = useState(false);

  // Effect to handle external content updates
  // This allows AddActuacionForm to push text (auto-fill) to the editor
  useEffect(() => {
    const updateContent = async () => {
      if (editor && initialContent !== undefined) {
        // Compare current editor HTML with incoming initialContent to avoid loops
        const currentHtml = await editor.blocksToFullHTML(editor.document);
        if (currentHtml !== initialContent) {
          try {
            let blocks;
            if (initialContent.startsWith("<")) {
              blocks = await editor.tryParseHTMLToBlocks(initialContent);
            } else {
              blocks = await editor.tryParseMarkdownToBlocks(initialContent);
            }
            editor.replaceBlocks(editor.document, blocks);
          } catch (e) {
            console.error("Failed to update content in NotionEditor", e);
          }
        }
      }
    };

    updateContent();
  }, [initialContent, editor]);

  // Initial ready state
  useEffect(() => {
    if (editor) {
      setIsReady(true);
    }
  }, [editor]);

  // Listen for changes and export as HTML
  const handleChange = async () => {
    if (editor) {
      const html = await editor.blocksToFullHTML(editor.document);
      onChange(html);
    }
  };

  if (!isReady) return <div className="p-4 text-slate-400">Cargando editor...</div>;

  return (
    <div className="notion-editor-container bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden min-h-[300px] transition-all duration-300">
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
