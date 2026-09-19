"use client";

import React, { useState } from "react";
import { FactionId } from "@/types/sss";
import { PLAYABLE_FACTIONS_LIST } from "@/lib/factions";
import { X, Sparkles, Plus, Check } from "lucide-react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    allowedFactions: FactionId[];
    initialPlanets: number;
  }) => Promise<void>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [selectedFactions, setSelectedFactions] = useState<FactionId[]>([
    "federation",
    "pact",
    "hegemony",
    "synthetic",
  ]);
  const [initialPlanets, setInitialPlanets] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const toggleFaction = (id: FactionId) => {
    setSelectedFactions((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedFactions(PLAYABLE_FACTIONS_LIST.map((f) => f.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor, dê um nome para a campanha.");
      return;
    }
    if (selectedFactions.length === 0) {
      setError("Selecione pelo menos uma facção permitida.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onCreate({
        name: name.trim(),
        allowedFactions: selectedFactions,
        initialPlanets,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar campanha.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0E1118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Criar Novo Sistema Estelar</h3>
              <p className="text-xs text-slate-400 font-mono">
                Defina os parâmetros iniciais da campanha como Mestre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Nome da Campanha
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Eos-Omega, Setor Vanguarda, Nexus-7..."
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/70 text-sm font-sans"
              required
            />
          </div>

          {/* Allowed Factions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Facções Galácticas Permitidas ({selectedFactions.length}/7)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-mono text-sky-400 hover:text-sky-300 underline"
              >
                Selecionar Todas
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAYABLE_FACTIONS_LIST.map((f) => {
                const isSelected = selectedFactions.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFaction(f.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-white/30 bg-white/10 shadow-sm"
                        : "border-white/5 bg-black/20 hover:border-white/15 text-slate-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    <div className="truncate flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{f.archetype}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Planet Count */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="uppercase tracking-wider">Planetas Iniciais no Sistema</span>
              <span className="font-bold text-sky-400">{initialPlanets} Planetas</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={initialPlanets}
              onChange={(e) => setInitialPlanets(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              O sistema traçará automaticamente órbitas circulares concêntricas para cada planeta em torno da estrela solar central.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white text-xs font-mono rounded-xl hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all font-mono disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Gerando Setor..." : "Criar Campanha"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
