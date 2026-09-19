"use client";

import React, { useState, useEffect, useRef } from "react";
import { FactionId, Campaign } from "@/types/sss";
import { PLAYABLE_FACTIONS_LIST, getFaction } from "@/lib/factions";
import {
  DiplomaticStatus,
  DIPLOMATIC_STATUSES,
  DIPLOMATIC_STATUS_CONFIG,
  getDiplomaticPairKey,
  getDiplomaticStatus,
} from "@/lib/diplomacy";
import {
  Handshake,
  X,
  Check,
  Radio,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface DiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onUpdateDiplomacy: (relations: Record<string, string>) => Promise<void>;
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onUpdateDiplomacy,
}) => {
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownKey(null);
      }
    }
    if (openDropdownKey) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownKey]);

  if (!isOpen) return null;

  const currentRelations = campaign.diplomatic_relations || {};

  // Handle Quick Cell Update from the Matrix
  const handleQuickStatusChange = async (
    fA: FactionId,
    fB: FactionId,
    newStatus: DiplomaticStatus
  ) => {
    if (fA === fB) return;
    setSaving(true);
    setOpenDropdownKey(null);

    const pairKey = getDiplomaticPairKey(fA, fB);
    const updatedRelations: Record<string, string> = {
      ...currentRelations,
      [pairKey]: newStatus,
    };

    try {
      await onUpdateDiplomacy(updatedRelations);
      setStatusMessage(
        `${getFaction(fA).shortName} ↔ ${getFaction(fB).shortName}: ${newStatus}`
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Erro ao atualizar diplomacia:", err);
      setStatusMessage("Erro ao salvar no banco. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  let countWar = 0;
  let countTension = 0;
  let countAllies = 0;
  let countNeutral = 0;

  for (let i = 0; i < PLAYABLE_FACTIONS_LIST.length; i++) {
    for (let j = i + 1; j < PLAYABLE_FACTIONS_LIST.length; j++) {
      const s = getDiplomaticStatus(
        currentRelations,
        PLAYABLE_FACTIONS_LIST[i].id,
        PLAYABLE_FACTIONS_LIST[j].id
      );
      if (s === "Guerra Aberta") countWar++;
      else if (s === "Tensão") countTension++;
      else if (s === "Aliados") countAllies++;
      else countNeutral++;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[99vw] xl:max-w-[1500px] max-h-[96vh] bg-[#0C0F17] border border-sky-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Handshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 font-sans">
                  Gestão Diplomática Interestelar
                </h3>
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
                  Mestre • Módulo 3 & 4
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                Matriz global bilateral do setor {campaign.name} • Clique em qualquer relação para editar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3 sm:p-5 space-y-4 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
          {/* Status Alert Banner if updated */}
          {statusMessage && (
            <div className="p-2.5 sm:p-3 bg-sky-950/60 border border-sky-500/40 rounded-2xl flex items-center gap-2 text-xs font-mono text-sky-200 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            <div className="p-2.5 sm:p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-300 font-semibold">
                  Aliados
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-200">
                {countAllies}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono text-amber-300 font-semibold">
                  Tensão
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-200">
                {countTension}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-mono text-rose-300 font-semibold">
                  Guerra Aberta
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-200">
                {countWar}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 bg-black/30 border border-slate-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  Neutros
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-300">
                {countNeutral}
              </span>
            </div>
          </div>

          {/* ===================================================================
              MATRIZ GLOBAL INTERESTELAR (21 PARES BILATERAIS)
             =================================================================== */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-200 font-bold truncate">
                  Matriz Global Interestelar (21 Pares Bilaterais)
                </h4>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 hidden sm:inline">
                Clique no badge para trocar o status
              </span>
            </div>

            <div className="w-full overflow-hidden border border-white/10 rounded-2xl bg-black/40 shadow-inner">
              <table className="w-full text-left text-xs font-mono border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-white/10 bg-black/70 text-slate-400 text-[10px] uppercase">
                    <th className="px-2.5 py-2 w-[16%]">Facção</th>
                    {PLAYABLE_FACTIONS_LIST.map((f) => (
                      <th key={f.id} className="px-1 py-2 text-center w-[12%]">
                        <div className="flex flex-col items-center gap-0.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                            style={{ backgroundColor: f.color }}
                          />
                          <span
                            style={{ color: f.color }}
                            className="font-bold text-[10px] sm:text-[11px] truncate w-full text-center"
                          >
                            {f.shortName}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {PLAYABLE_FACTIONS_LIST.map((rowFaction) => (
                    <tr
                      key={rowFaction.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Row Header */}
                      <td className="px-2.5 py-2 font-bold border-r border-white/5 w-[16%]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: rowFaction.color }}
                          />
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-slate-100 block text-xs truncate">
                              {rowFaction.shortName}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono block truncate">
                              {rowFaction.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columns */}
                      {PLAYABLE_FACTIONS_LIST.map((colFaction, colIndex) => {
                        if (rowFaction.id === colFaction.id) {
                          return (
                            <td
                              key={colFaction.id}
                              className="p-1 text-center text-slate-700 bg-white/[0.01] select-none font-bold text-xs w-[12%]"
                            >
                              —
                            </td>
                          );
                        }

                        const cellKey = `${rowFaction.id}_${colFaction.id}`;
                        const isDropdownOpen = openDropdownKey === cellKey;
                        const status = getDiplomaticStatus(
                          currentRelations,
                          rowFaction.id,
                          colFaction.id
                        );
                        const config = DIPLOMATIC_STATUS_CONFIG[status];
                        const displayStatus =
                          status === "Guerra Aberta" ? "Guerra" : status;

                        return (
                          <td key={colFaction.id} className="px-1 py-1.5 text-center relative w-[12%]">
                            {/* Interactive Status Badge Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDropdownKey(isDropdownOpen ? null : cellKey)
                              }
                              className={`group inline-flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer border ${config.badgeClass} hover:scale-105 active:scale-95 w-full max-w-[100px]`}
                              title={`Relação entre ${rowFaction.shortName} e ${colFaction.shortName}: ${status}. Clique para alterar.`}
                            >
                              <span className="truncate">{displayStatus}</span>
                              <ChevronDown className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            {/* Floating Dropdown Popover */}
                            {isDropdownOpen && (
                              <div
                                ref={dropdownRef}
                                className={`absolute z-50 top-full mt-1 w-36 sm:w-40 bg-[#0E121A] border border-white/20 rounded-2xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                                  colIndex >= 4
                                    ? "right-0"
                                    : colIndex <= 1
                                    ? "left-0"
                                    : "left-1/2 -translate-x-1/2"
                                }`}
                              >
                                <div className="px-2 py-1 text-[9px] font-mono text-slate-400 border-b border-white/5 uppercase tracking-wider text-left">
                                  Definir Status:
                                </div>
                                {DIPLOMATIC_STATUSES.map((st) => {
                                  const stConfig = DIPLOMATIC_STATUS_CONFIG[st];
                                  const isSelected = st === status;
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        handleQuickStatusChange(
                                          rowFaction.id,
                                          colFaction.id,
                                          st
                                        )
                                      }
                                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-left text-xs font-mono transition-all ${
                                        isSelected
                                          ? "bg-white/15 text-white font-bold"
                                          : "text-slate-300 hover:text-white hover:bg-white/10"
                                      }`}
                                    >
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] ${stConfig.badgeClass}`}
                                      >
                                        {st}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/50 flex items-center justify-between flex-shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Sincronizado automaticamente no documento raiz da Campanha</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl transition-colors font-bold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
