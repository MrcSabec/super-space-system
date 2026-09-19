"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Highlighter,
  List,
  Plus,
  X,
  ChevronRight,
  RotateCcw,
  Check,
  FileText,
  Lock,
  Pencil,
} from "lucide-react";
import { PlayerNote } from "@/types/sss";

interface CommandNotepadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: PlayerNote[];
  onSaveNotes: (updatedNotes: PlayerNote[]) => Promise<void>;
  factionColor: string;
  factionBgGlow: string;
  factionName: string;
  leaderTitle: string;
}

export const CommandNotepadDrawer: React.FC<CommandNotepadDrawerProps> = ({
  isOpen,
  onClose,
  notes: initialNotes,
  onSaveNotes,
  factionColor,
  factionBgGlow,
  factionName,
  leaderTitle,
}) => {
  // Helper to generate a default note if none exist
  const createDefaultNote = (): PlayerNote => ({
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: "Planos de Turno",
    content: "<p>Registro confidencial de inteligência e ordens de comando...</p>",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // State: Notes list
  const [notes, setNotes] = useState<PlayerNote[]>(() => {
    if (initialNotes && initialNotes.length > 0) {
      return initialNotes;
    }
    return [createDefaultNote()];
  });

  // State: Active tab ID
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    if (initialNotes && initialNotes.length > 0) {
      return initialNotes[0].id;
    }
    return notes[0]?.id || "note_default";
  });

  // Tab inline editing state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Save sync status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  // Refs for rock-solid sync (prevents closure staleness in TipTap)
  const activeNoteIdRef = useRef<string>(activeNoteId);
  activeNoteIdRef.current = activeNoteId;

  const pendingNotesRef = useRef<PlayerNote[]>(notes);
  pendingNotesRef.current = notes;

  const lastSavedNotesRef = useRef<PlayerNote[]>(notes);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save to parent/Firestore immediately (for structural changes: add, delete, rename, tab switch)
  const saveImmediately = useCallback(
    async (updatedNotes: PlayerNote[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      try {
        setSaveStatus("saving");
        lastSavedNotesRef.current = updatedNotes;
        await onSaveNotes(updatedNotes);
        setSaveStatus("saved");
        setLastSavedTime(
          new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        );
      } catch (err) {
        console.error("Falha ao sincronizar notas:", err);
        setSaveStatus("saved");
      }
    },
    [onSaveNotes]
  );

  // Debounced auto-save function (1500ms delay for content typing)
  const scheduleDebouncedSave = useCallback(
    (updatedNotes: PlayerNote[]) => {
      setSaveStatus("saving");
      pendingNotesRef.current = updatedNotes;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          lastSavedNotesRef.current = updatedNotes;
          await onSaveNotes(updatedNotes);
          setSaveStatus("saved");
          setLastSavedTime(
            new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          );
        } catch (err) {
          console.error("Falha ao salvar anotações:", err);
          setSaveStatus("saved");
        }
      }, 1500);
    },
    [onSaveNotes]
  );

  // Flush any pending save immediately
  const flushPendingSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      await saveImmediately(pendingNotesRef.current);
    }
  }, [saveImmediately]);

  // TipTap Editor initialization
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: notes.find((n) => n.id === activeNoteId)?.content || "",
    editorProps: {
      attributes: {
        class:
          "w-full min-h-[420px] p-5 focus:outline-none text-slate-200 text-sm font-sans leading-relaxed selection:bg-white/20",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const currentActiveId = activeNoteIdRef.current;

      const updatedNotes = pendingNotesRef.current.map((n) =>
        n.id === currentActiveId ? { ...n, content: html, updatedAt: Date.now() } : n
      );
      pendingNotesRef.current = updatedNotes;
      setNotes(updatedNotes);
      scheduleDebouncedSave(updatedNotes);
    },
    onBlur: () => {
      flushPendingSave();
    },
  });

  // Sync external changes (e.g. from Firestore stream) only if not modified locally
  useEffect(() => {
    if (!initialNotes || initialNotes.length === 0) return;

    const currentJson = JSON.stringify(lastSavedNotesRef.current);
    const incomingJson = JSON.stringify(initialNotes);

    if (currentJson !== incomingJson) {
      pendingNotesRef.current = initialNotes;
      lastSavedNotesRef.current = initialNotes;
      setNotes(initialNotes);

      // Verify active tab exists
      if (!initialNotes.some((n) => n.id === activeNoteIdRef.current)) {
        const firstId = initialNotes[0].id;
        setActiveNoteId(firstId);
        activeNoteIdRef.current = firstId;
        if (editor) {
          editor.commands.setContent(initialNotes[0].content || "<p></p>", { emitUpdate: false });
        }
      }
    }
  }, [initialNotes, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle Tab Switch
  const handleSelectTab = async (tabId: string) => {
    if (tabId === activeNoteIdRef.current) return;

    // 1. Capture current editor content into current note before switching
    if (editor) {
      const currentHTML = editor.getHTML();
      const currentActiveId = activeNoteIdRef.current;
      const updatedNotes = pendingNotesRef.current.map((n) =>
        n.id === currentActiveId ? { ...n, content: currentHTML, updatedAt: Date.now() } : n
      );
      pendingNotesRef.current = updatedNotes;
      setNotes(updatedNotes);
    }

    // 2. Flush pending save
    await flushPendingSave();

    // 3. Switch active note
    setActiveNoteId(tabId);
    activeNoteIdRef.current = tabId;

    // 4. Set editor content to new tab
    const targetNote = pendingNotesRef.current.find((n) => n.id === tabId);
    if (editor && targetNote) {
      editor.commands.setContent(targetNote.content || "<p></p>", { emitUpdate: false });
      setTimeout(() => {
        editor.commands.focus("end");
      }, 50);
    }
  };

  // Handle Add New Tab (+ Nova Aba)
  const handleAddTab = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. Capture current editor content first
    if (editor) {
      const currentHTML = editor.getHTML();
      const currentActiveId = activeNoteIdRef.current;
      pendingNotesRef.current = pendingNotesRef.current.map((n) =>
        n.id === currentActiveId ? { ...n, content: currentHTML, updatedAt: Date.now() } : n
      );
    }

    // 2. Clear any pending debounced timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 3. Create the new note
    const newId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newIndex = pendingNotesRef.current.length + 1;
    const newNote: PlayerNote = {
      id: newId,
      title: `Nota ${newIndex}`,
      content: "<p></p>",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...pendingNotesRef.current, newNote];
    pendingNotesRef.current = updated;
    setNotes(updated);
    setActiveNoteId(newId);
    activeNoteIdRef.current = newId;

    // 4. Clear editor content immediately for the new tab
    if (editor) {
      editor.commands.setContent("<p></p>", { emitUpdate: false });
      setTimeout(() => {
        editor.commands.focus("end");
      }, 50);
    }

    // 5. Structural change: save immediately to database
    await saveImmediately(updated);
  };

  // Handle Start Rename
  const handleStartRename = (tab: PlayerNote, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);
  };

  // Handle Commit Rename
  const handleCommitRename = async () => {
    if (!editingTabId) return;
    const trimmed = editingTitle.trim() || "Sem Título";
    const updated = pendingNotesRef.current.map((n) =>
      n.id === editingTabId ? { ...n, title: trimmed, updatedAt: Date.now() } : n
    );
    pendingNotesRef.current = updated;
    setNotes(updated);
    setEditingTabId(null);
    await saveImmediately(updated);
  };

  // Handle Cancel Rename
  const handleCancelRename = () => {
    setEditingTabId(null);
  };

  // Handle Delete Tab
  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (editingTabId === tabId) {
      setEditingTabId(null);
    }

    let updated = pendingNotesRef.current.filter((n) => n.id !== tabId);
    let nextActiveId = activeNoteIdRef.current;

    if (updated.length === 0) {
      const resetNote = createDefaultNote();
      updated = [resetNote];
      nextActiveId = resetNote.id;
    } else if (activeNoteIdRef.current === tabId) {
      const deletedIndex = pendingNotesRef.current.findIndex((n) => n.id === tabId);
      const nextIndex = Math.max(0, deletedIndex - 1);
      nextActiveId = updated[nextIndex]?.id || updated[0].id;
    }

    pendingNotesRef.current = updated;
    setNotes(updated);
    setActiveNoteId(nextActiveId);
    activeNoteIdRef.current = nextActiveId;

    const newActiveNote = updated.find((n) => n.id === nextActiveId);
    if (editor && newActiveNote) {
      editor.commands.setContent(newActiveNote.content || "<p></p>", { emitUpdate: false });
    }

    await saveImmediately(updated);
  };

  // Toggle Highlight with Faction Color
  const handleToggleHighlight = () => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color: `${factionColor}35` }).run();
  };

  const currentActiveNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  return (
    <>
      {/* Semi-transparent backdrop blur */}
      <div
        onClick={async () => {
          await flushPendingSave();
          onClose();
        }}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Command Notepad Drawer (Right-docked) */}
      <aside
        aria-label="Bloco de Notas de Comando"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] lg:w-[600px] bg-[#0A0C10] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Top Header: Title, Security Badge, Save Status & Close Button */}
        <div className="h-14 px-4 bg-[#0D1017] border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: factionBgGlow,
                borderColor: `${factionColor}40`,
                color: factionColor,
              }}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-mono font-black text-slate-100 uppercase tracking-wider">
                  Diário de Comando
                </h2>
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Lock className="w-2.5 h-2.5" />
                  Privado
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {leaderTitle} • {factionName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 border border-white/5 rounded-lg text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  saveStatus === "saving" ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                }`}
              />
              <span className="text-slate-400 text-[10px]">
                {saveStatus === "saving" ? "Salvando..." : lastSavedTime ? `Salvo ${lastSavedTime}` : "Salvo"}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={async () => {
                await flushPendingSave();
                onClose();
              }}
              title="Fechar Diário (Salva automaticamente)"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Tab Navigation Bar with [+ Nova Aba] */}
        <div className="bg-[#08090C] border-b border-white/10 px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0">
          {/* Scrollable Tabs List */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-0.5 min-w-0 flex-1">
            {notes.map((tab) => {
              const isActive = tab.id === activeNoteId;
              const isEditing = editingTabId === tab.id;

              return (
                <div
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  onDoubleClick={(e) => handleStartRename(tab, e)}
                  title={`Aba: ${tab.title} (Duplo clique ou clique no lápis para renomear)`}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer select-none border flex-shrink-0 ${
                    isActive
                      ? "bg-[#131825] text-white font-bold border-white/20 shadow-sm"
                      : "bg-[#0B0D13] text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15"
                  }`}
                  style={{
                    borderColor: isActive ? `${factionColor}70` : undefined,
                    boxShadow: isActive ? `0 0 12px ${factionColor}20` : undefined,
                  }}
                >
                  {/* Faction color pip for active tab */}
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: factionColor }}
                    />
                  )}

                  {/* Tab Title (Display or Inline Rename Input) */}
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleCommitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename();
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="w-24 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-mono border border-sky-400 outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCommitRename}
                        title="Confirmar nome"
                        className="p-0.5 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate max-w-[110px] sm:max-w-[140px]">
                        {tab.title}
                      </span>
                      {/* Rename pencil icon on hover */}
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(tab, e)}
                        title="Renomear aba"
                        className="p-0.5 text-slate-500 hover:text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </>
                  )}

                  {/* Delete Tab "X" Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTab(tab.id, e)}
                    title="Excluir aba"
                    className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 opacity-40 hover:opacity-100 transition-all ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* [+ Nova Aba] Action Button */}
          <button
            type="button"
            onClick={(e) => handleAddTab(e)}
            title="Criar nova aba de anotações"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/20 hover:border-white/40 transition-all shadow-sm flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nova Aba</span>
          </button>
        </div>

        {/* Minimalist Rich Text Toolbar */}
        {editor && (
          <div className="bg-[#0C0F17] border-b border-white/10 px-3 py-1.5 flex flex-wrap items-center gap-1 flex-shrink-0">
            {/* Headings */}
            <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Título Principal (H1)"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Subtítulo (H2)"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Seção (H3)"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Formatting (Bold, Italic) */}
            <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Negrito (Ctrl+B)"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("bold")
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Itálico (Ctrl+I)"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("italic")
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Highlight (Faction Pastel Glow) */}
            <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
              <button
                type="button"
                onClick={handleToggleHighlight}
                title="Marcar / Destaque de Facção"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("highlight")
                    ? "border font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                style={
                  editor.isActive("highlight")
                    ? {
                        backgroundColor: factionBgGlow,
                        borderColor: `${factionColor}60`,
                        color: factionColor,
                      }
                    : {}
                }
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Destaque</span>
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Lista de Tópicos"
                className={`p-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  editor.isActive("bulletList")
                    ? "bg-white/15 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear / Reset */}
            <div className="flex items-center gap-0.5 ml-auto">
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                title="Limpar formatação da seleção"
                className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TipTap Editor Body */}
        <div className="flex-1 overflow-y-auto bg-[#08090C] custom-scrollbar focus-within:ring-0">
          <EditorContent
            editor={editor}
            className="h-full focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[420px] [&_.tiptap_p]:my-2 [&_.tiptap_p]:leading-relaxed [&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-black [&_.tiptap_h1]:text-white [&_.tiptap_h1]:mt-4 [&_.tiptap_h1]:mb-2 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:text-slate-100 [&_.tiptap_h2]:mt-3 [&_.tiptap_h2]:mb-1.5 [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:text-slate-200 [&_.tiptap_h3]:mt-2 [&_.tiptap_h3]:mb-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:my-2 [&_.tiptap_li]:my-0.5 [&_.tiptap_strong]:text-white [&_.tiptap_strong]:font-bold [&_.tiptap_em]:italic [&_.tiptap_mark]:rounded-sm [&_.tiptap_mark]:px-1"
          />
        </div>

        {/* Footer info bar */}
        <div className="h-9 px-4 bg-[#0D1017] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: factionColor }}
            />
            {currentActiveNote?.title} • {notes.length} aba{notes.length > 1 ? "s" : ""}
          </span>
          <span className="text-[10px] text-slate-500">
            Sincronização com debounce (1.5s)
          </span>
        </div>
      </aside>
    </>
  );
};
