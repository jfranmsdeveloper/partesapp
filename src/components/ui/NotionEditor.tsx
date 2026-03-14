import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs, createCodeBlockSpec } from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";
import { aiService, useAIStore } from "../../services/aiService";
import { Loader2 } from "lucide-react";

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
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { engine, isLoaded } = useAIStore();

  // AI Ghostwriter logic
  useEffect(() => {
    if (!editor || engine !== 'webllm' || !isLoaded) return;

    let timeoutId: NodeJS.Timeout;

    const handleTextChange = async () => {
      setSuggestion(null);
      clearTimeout(timeoutId);

      // detect typing pause
      timeoutId = setTimeout(async () => {
        setIsSuggesting(true);
        try {
          // const selection = editor.getSelection(); // We want to know where the cursor is
          const blocks = editor.document;
          const contextText = await editor.blocksToMarkdownLossy(blocks);
          
          if (contextText.length < 3) {
             setIsSuggesting(false);
             return;
          }

          const prompt = `Actúa como un escritor fantasma profesional. Basado en este contexto técnico de un parte de trabajo, completa la frase actual discretamente. Solo devuelve entre 1 y 4 palabras. No uses comillas.\nContexto: "${contextText}"`;
          
          const completion = await aiService.generate(prompt);
          if (completion && completion.trim().length > 0 && completion.length < 40) {
            setSuggestion(completion.trim());
          }
        } catch (err) {
          console.error("Ghostwriter error:", err);
        } finally {
          setIsSuggesting(false);
        }
      }, 800); // 0.8s pause for "real-time" feel
    };

    const unsubscribe = editor.onChange(handleTextChange);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [editor, engine, isLoaded]);

  // Handle Tab key to accept suggestion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        
        const cursorPosition = editor.getTextCursorPosition();
        if (!cursorPosition) return;
        const currentBlock = cursorPosition.block;
        
        // BlockNote content is an array of StyledText
        const newContent = JSON.parse(JSON.stringify(currentBlock.content));
        
        // If last element is text, append to it. Else create new.
        if (newContent.length > 0 && newContent[newContent.length-1].type === 'text') {
            newContent[newContent.length-1].text += " " + suggestion;
        } else {
            newContent.push({ type: "text", text: suggestion, styles: {} });
        }
        
        editor.updateBlock(currentBlock, {
            content: newContent
        });
        setSuggestion(null);
      }
      
      // Clear suggestion on any keypress (except Tab) to stay reactive
      if (e.key !== 'Tab') {
          setSuggestion(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, suggestion]);

  // Effect to handle external content updates
  useEffect(() => {
    const updateContent = async () => {
      if (editor && initialContent !== undefined) {
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
    <div className="notion-editor-container relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden min-h-[300px] transition-all duration-300">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
        className="min-h-[300px]"
        data-placeholder={placeholder}
      />
      
      {/* Ghostwriter UI Indicator - More integrated */}
      {(isSuggesting || suggestion) && (
        <div className="absolute top-2 right-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 dark:bg-white/5 backdrop-blur-md rounded-full border border-indigo-100 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            {isSuggesting ? (
                <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">IA Pensando...</span>
                </>
            ) : (
                <>
                    <span className="text-[10px] font-medium text-slate-500">Sugerencia (TAB):</span>
                    <span className="text-[10px] font-bold text-indigo-600 italic">"{suggestion}"</span>
                </>
            )}
        </div>
      )}
    </div>
  );
};
