"use client";

import React, { useState } from "react";
import { X, LogIn, ArrowRight } from "lucide-react";

interface JoinCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Digite o código da campanha.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onJoin(code.trim().toUpperCase());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar na campanha.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0E1118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Entrar em Campanha</h3>
              <p className="text-xs text-slate-400 font-mono">
                Conecte-se ao setor estelar usando o código do Mestre
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Código de Acesso (Campaign Code)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: SSS-A8F9K"
              maxLength={12}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sky-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 font-mono text-center tracking-widest text-lg uppercase"
              required
            />
            <p className="text-[11px] font-mono text-slate-500 mt-1.5 text-center">
              Solicite o código único de 8 caracteres ao Mestre da mesa.
            </p>
          </div>

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
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all font-mono disabled:opacity-50"
            >
              <span>{isSubmitting ? "Validando..." : "Acessar Sistema"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
