"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PlayerCharacter,
  ResourceKey,
  QualitativeResource,
} from "@/types/sss";
import { getFaction } from "@/lib/factions";
import {
  SATISFACTION_LEVELS,
  ECONOMY_LEVELS,
  MILITARY_LEVELS,
} from "@/lib/factionLore";
import {
  EOS_OMEGA_RESOURCES,
  FACTION_INITIAL_CENSUS,
  FACTION_INITIAL_MILITARY_TIERS,
  normalizeCharacterResources,
} from "@/lib/resources";
import {
  EOS_CHARACTERISTICS_CATEGORIES,
  TOTAL_CHARACTERISTICS_COUNT,
  ROMAN_LEVELS,
  getCharacteristicLevel,
  setCharacteristicLevelInList,
  countUnlockedCharacteristics,
} from "@/lib/eosCharacteristics";
import { savePlayerCharacter } from "@/lib/db";
import {
  X,
  Sliders,
  Activity,
  Coins,
  Crown,
  Sparkles,
  Users,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Radio,
  BookOpen,
  Plus,
  Minus,
  Eye,
} from "lucide-react";

interface PlayerPillarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: PlayerCharacter[];
  campaignName: string;
  onUpdateCharacter?: (char: PlayerCharacter) => Promise<void>;
  onOpenCharacteristicsModal?: () => void;
}

type ActiveCellPopover =
  | { type: "satisfaction"; charId: string }
  | { type: "economy"; charId: string }
  | { type: "military"; charId: string }
  | { type: "perks"; charId: string }
  | null;

export interface PillarSelectorTarget {
  char: PlayerCharacter;
  pillar: "satisfaction" | "economy" | "military";
}

export const PlayerPillarsModal: React.FC<PlayerPillarsModalProps> = ({
  isOpen,
  onClose,
  characters,
  campaignName,
  onUpdateCharacter,
  onOpenCharacteristicsModal,
}) => {
  const [activePopover, setActivePopover] = useState<ActiveCellPopover>(null);
  const [pillarSelector, setPillarSelector] = useState<PillarSelectorTarget | null>(null);
  const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
  const [creditsInputVal, setCreditsInputVal] = useState<string>("");
  const [editingPopId, setEditingPopId] = useState<string | null>(null);
  const [popInputVal, setPopInputVal] = useState<string>("");
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    }
    if (activePopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopover]);

  if (!isOpen) return null;

  // Show a temporary subtle feedback toast
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Direct updater for a specific character
  const updateCharacter = async (charId: string, partial: Partial<PlayerCharacter>) => {
    const target = characters.find((c) => c.id === charId);
    if (!target) return;
    const updated: PlayerCharacter = {
      ...target,
      ...partial,
      updatedAt: Date.now(),
    };
    try {
      if (onUpdateCharacter) {
        await onUpdateCharacter(updated);
      } else {
        await savePlayerCharacter(updated);
      }
    } catch (err) {
      console.error("Erro ao salvar personagem:", err);
    }
  };

  // Helper: check empty / depleted stocks
  const getResourceAlerts = (char: PlayerCharacter) => {
    const res = normalizeCharacterResources(char, char.factionId);
    const emptyList: string[] = [];
    for (const item of EOS_OMEGA_RESOURCES) {
      const stock = res[item.key]?.estoque;
      if (stock === "vazios") {
        emptyList.push(item.name);
      }
    }
    return emptyList;
  };

  // Calculate totals for summary cards
  const totalCredits = characters.reduce(
    (acc, c) => acc + (c.galacticCredits ?? FACTION_INITIAL_CENSUS[c.factionId]?.credits ?? 0),
    0
  );
  const totalPopulation = characters.reduce(
    (acc, c) => acc + (c.populationCount ?? FACTION_INITIAL_CENSUS[c.factionId]?.population ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[99vw] xl:max-w-[1550px] max-h-[96vh] bg-[#0C0F17] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/25">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">
                  Panóptico do Mestre • Controle de Impérios
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
                  Data Grid • Edição Inline
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Visão consolidada de todas as facções em {campaignName} • Alterações salvas instantaneamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Metric Pills */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-[#090C12] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>
                <strong>{characters.length}</strong> Facções Ativas
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Cofre Galáctico: <strong>{totalCredits.toLocaleString("pt-BR")} ₵</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                População Total: <strong>{totalPopulation.toLocaleString("pt-BR")}</strong>
              </span>
            </div>

            {onOpenCharacteristicsModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCharacteristicsModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                title="Abrir auditoria e gestão completa de características dos jogadores"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auditoria de Perks</span>
              </button>
            )}
          </div>

          {/* Realtime Save Toast */}
          {saveToast && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>

        {/* Main Content Area: Responsive Data Grid */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 pb-36 custom-scrollbar">
          {characters.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Nenhum jogador concluiu a criação de ficha nesta campanha ainda.</p>
              <p className="text-[11px] text-slate-500">
                Os impérios aparecerão automaticamente nesta grade assim que criarem seus personagens.
              </p>
            </div>
          ) : (
            <div className="w-full border border-white/10 rounded-2xl bg-black/40 shadow-2xl">
              <table className="w-full text-left text-xs font-mono border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-white/10 bg-black/70 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="px-3 py-2.5 w-[21%]">
                      Facção & Líder
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[11%]">
                      Satisfação
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[11%]">
                      Economia
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[13%]">
                      Cofre
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[12%]">
                      População
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[12%]">
                      Poderio (Divs)
                    </th>
                    <th className="px-1.5 py-2.5 text-center w-[10%]">
                      <div className="flex items-center justify-center gap-1">
                        <span>Conhecimento</span>
                        {onOpenCharacteristicsModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenCharacteristicsModal();
                            }}
                            title="Abrir Painel Completo de Características"
                            className="p-0.5 rounded text-amber-400 hover:text-amber-200 hover:bg-amber-400/20 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-2.5 text-left w-[10%]">
                      Avisos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {characters.map((char, index) => {
                    const isBottomRow = index >= characters.length - 2 || (characters.length <= 3 && index > 0);
                    const isRowActive = activePopover?.charId === char.id;
                    const fac = getFaction(char.factionId);
                    const census = FACTION_INITIAL_CENSUS[char.factionId] || FACTION_INITIAL_CENSUS.federation;
                    const credits = char.galacticCredits ?? census.credits;
                    const pop = char.populationCount ?? census.population;
                    const satisfactionLvl = char.satisfaction ?? 2;
                    const satConfig = SATISFACTION_LEVELS[satisfactionLvl] || SATISFACTION_LEVELS[2];
                    const economyLvl = char.economy ?? 2;
                    const ecoConfig = ECONOMY_LEVELS[economyLvl] || ECONOMY_LEVELS[2];
                    const militaryLvl = char.military ?? 2;
                    const milConfig = MILITARY_LEVELS[militaryLvl] || MILITARY_LEVELS[2];
                    const points = char.characteristic_points ?? 2;
                    const unlockedPerks = char.unlocked_characteristics || [];
                    const alerts = getResourceAlerts(char);

                    // Total divisions mobilized
                    const initialMilitary = FACTION_INITIAL_MILITARY_TIERS[char.factionId] || FACTION_INITIAL_MILITARY_TIERS.neutral;
                    const totalDivs =
                      (char.lightInfantry ?? initialMilitary.lightInfantry) +
                      (char.heavyInfantry ?? initialMilitary.heavyInfantry) +
                      (char.lightVehicles ?? initialMilitary.lightVehicles) +
                      (char.heavyVehicles ?? initialMilitary.heavyVehicles) +
                      (char.eliteUnits ?? initialMilitary.eliteUnits);

                    return (
                      <tr
                        key={char.id}
                        className={`hover:bg-white/[0.02] transition-colors group ${
                          isRowActive ? "relative z-40" : "relative z-10"
                        }`}
                      >
                        {/* 1. Facção & Comandante */}
                        <td className="px-3 py-2 w-[21%] border-r border-white/5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 shadow-md ring-2 ring-white/10"
                              style={{ backgroundColor: fac.color }}
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-slate-100 text-xs truncate">
                                  {char.characterName}
                                </span>
                                <span
                                  className="text-[9px] px-1 py-0.2 rounded border font-mono uppercase flex-shrink-0"
                                  style={{
                                    backgroundColor: `${fac.color}15`,
                                    color: fac.color,
                                    borderColor: `${fac.color}35`,
                                  }}
                                >
                                  {fac.shortName}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                {char.leaderTitle} • @{char.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Satisfação (Pilar 1) */}
                        <td className="px-1 py-2 text-center w-[11%]">
                          <div className="flex items-center justify-center gap-1 w-full max-w-[130px] mx-auto">
                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.max(0, satisfactionLvl - 1);
                                await updateCharacter(char.id, { satisfaction: next });
                                showToast(`${char.characterName}: Satisfação -> ${SATISFACTION_LEVELS[next]?.label}`);
                              }}
                              disabled={satisfactionLvl === 0}
                              title="Diminuir Satisfação"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPillarSelector({ char, pillar: "satisfaction" })}
                              className={`flex-1 min-w-[70px] px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03] hover:brightness-125 cursor-pointer ${satConfig.bg} ${satConfig.border}`}
                              style={{ color: satConfig.color }}
                              title="Clique para abrir seletor prioritário de Satisfação"
                            >
                              <span className="truncate">{satConfig.label}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.min(4, satisfactionLvl + 1);
                                await updateCharacter(char.id, { satisfaction: next });
                                showToast(`${char.characterName}: Satisfação -> ${SATISFACTION_LEVELS[next]?.label}`);
                              }}
                              disabled={satisfactionLvl === 4}
                              title="Aumentar Satisfação"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 3. Economia (Pilar 2) */}
                        <td className="px-1 py-2 text-center w-[11%]">
                          <div className="flex items-center justify-center gap-1 w-full max-w-[130px] mx-auto">
                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.max(0, economyLvl - 1);
                                await updateCharacter(char.id, { economy: next });
                                showToast(`${char.characterName}: Economia -> ${ECONOMY_LEVELS[next]?.label}`);
                              }}
                              disabled={economyLvl === 0}
                              title="Diminuir Economia"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPillarSelector({ char, pillar: "economy" })}
                              className={`flex-1 min-w-[70px] px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03] hover:brightness-125 cursor-pointer ${ecoConfig.bg} ${ecoConfig.border}`}
                              style={{ color: ecoConfig.color }}
                              title="Clique para abrir seletor prioritário de Economia"
                            >
                              <span className="truncate">{ecoConfig.label}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.min(4, economyLvl + 1);
                                await updateCharacter(char.id, { economy: next });
                                showToast(`${char.characterName}: Economia -> ${ECONOMY_LEVELS[next]?.label}`);
                              }}
                              disabled={economyLvl === 4}
                              title="Aumentar Economia"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 4. Cofre (Créditos) */}
                        <td className="px-1.5 py-2 text-center w-[13%]">
                          {editingCreditsId === char.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={creditsInputVal}
                                onChange={(e) => setCreditsInputVal(e.target.value)}
                                onBlur={async () => {
                                  const val = Math.max(0, parseInt(creditsInputVal) || 0);
                                  await updateCharacter(char.id, { galacticCredits: val });
                                  setEditingCreditsId(null);
                                  showToast(`${char.characterName}: Créditos atualizados para ${val}`);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    const val = Math.max(0, parseInt(creditsInputVal) || 0);
                                    await updateCharacter(char.id, { galacticCredits: val });
                                    setEditingCreditsId(null);
                                    showToast(`${char.characterName}: Créditos atualizados para ${val}`);
                                  } else if (e.key === "Escape") {
                                    setEditingCreditsId(null);
                                  }
                                }}
                                className="w-20 px-1.5 py-0.5 bg-black/60 border border-amber-400/50 rounded-lg text-xs font-mono font-bold text-amber-300 text-center focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1 w-full max-w-[125px]">
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = Math.max(0, credits - 100);
                                  await updateCharacter(char.id, { galacticCredits: next });
                                }}
                                title="Subtrair 100 Créditos"
                                className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                              >
                                -
                              </button>

                              <span
                                onClick={() => {
                                  setEditingCreditsId(char.id);
                                  setCreditsInputVal(String(credits));
                                }}
                                className="px-1.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300 font-bold cursor-pointer hover:bg-amber-400/20 transition-all text-[11px] truncate flex-1 text-center"
                                title="Clique para editar valor numérico"
                              >
                                {credits.toLocaleString("pt-BR")} ₵
                              </span>

                              <button
                                type="button"
                                onClick={async () => {
                                  const next = credits + 100;
                                  await updateCharacter(char.id, { galacticCredits: next });
                                }}
                                title="Adicionar 100 Créditos"
                                className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 5. População Total */}
                        <td className="px-1.5 py-2 text-center w-[12%]">
                          {editingPopId === char.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={popInputVal}
                                onChange={(e) => setPopInputVal(e.target.value)}
                                onBlur={async () => {
                                  const val = Math.max(0, parseInt(popInputVal) || 0);
                                  await updateCharacter(char.id, { populationCount: val });
                                  setEditingPopId(null);
                                  showToast(`${char.characterName}: População atualizada para ${val}`);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    const val = Math.max(0, parseInt(popInputVal) || 0);
                                    await updateCharacter(char.id, { populationCount: val });
                                    setEditingPopId(null);
                                    showToast(`${char.characterName}: População atualizada para ${val}`);
                                  } else if (e.key === "Escape") {
                                    setEditingPopId(null);
                                  }
                                }}
                                className="w-full max-w-[90px] px-1 py-0.5 bg-black/80 border border-sky-400/50 rounded text-[11px] font-mono font-bold text-sky-300 text-center focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1 w-full max-w-[125px]">
                              <button
                                type="button"
                                onClick={async () => {
                                  const next = Math.max(0, pop - 1000);
                                  await updateCharacter(char.id, { populationCount: next });
                                }}
                                title="Subtrair 1.000 habitantes"
                                className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                              >
                                -
                              </button>

                              <span
                                onClick={() => {
                                  setEditingPopId(char.id);
                                  setPopInputVal(String(pop));
                                }}
                                className="px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-bold cursor-pointer hover:bg-white/10 transition-all text-[11px] truncate flex-1 text-center"
                                title="Clique para editar população"
                              >
                                {pop.toLocaleString("pt-BR")}
                              </span>

                              <button
                                type="button"
                                onClick={async () => {
                                  const next = pop + 1000;
                                  await updateCharacter(char.id, { populationCount: next });
                                }}
                                title="Adicionar 1.000 habitantes"
                                className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 6. Poderio Militar (Pilar 3) */}
                        <td className="px-1 py-2 text-center w-[12%]">
                          <div className="flex items-center justify-center gap-1 w-full max-w-[145px] mx-auto">
                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.max(0, militaryLvl - 1);
                                await updateCharacter(char.id, { military: next });
                                showToast(`${char.characterName}: Poderio -> ${MILITARY_LEVELS[next]?.label}`);
                              }}
                              disabled={militaryLvl === 0}
                              title="Diminuir Poderio"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPillarSelector({ char, pillar: "military" })}
                              className={`flex-1 min-w-[75px] px-2 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03] hover:brightness-125 cursor-pointer ${milConfig.bg} ${milConfig.border}`}
                              style={{ color: milConfig.color }}
                              title="Clique para abrir seletor prioritário de Poderio Militar"
                            >
                              <span className="truncate">{milConfig.label} ({totalDivs})</span>
                              <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.min(4, militaryLvl + 1);
                                await updateCharacter(char.id, { military: next });
                                showToast(`${char.characterName}: Poderio -> ${MILITARY_LEVELS[next]?.label}`);
                              }}
                              disabled={militaryLvl === 4}
                              title="Aumentar Poderio"
                              className="w-5 h-6 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs flex-shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 7. Conhecimento & Características */}
                        <td className={`px-1 py-2 text-center w-[10%] ${activePopover?.charId === char.id && activePopover.type === "perks" ? "relative z-50" : "relative"}`}>
                          <div className="inline-flex items-center justify-center gap-1 w-full max-w-[110px]">
                            <button
                              type="button"
                              onClick={async () => {
                                const next = Math.max(0, points - 1);
                                await updateCharacter(char.id, { characteristic_points: next });
                                showToast(`${char.characterName}: Pontos de Característica -> ${next}`);
                              }}
                              title="Deduzir 1 ponto de característica"
                              className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActivePopover(
                                  activePopover?.type === "perks" && activePopover.charId === char.id
                                    ? null
                                    : { type: "perks", charId: char.id }
                                )
                              }
                              className="px-1.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold hover:bg-amber-400/20 transition-all flex items-center justify-center gap-0.5 text-[10px] truncate flex-1"
                              title="Ver e gerenciar licenças e níveis de conhecimento do jogador"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                              <span className="truncate">{points} Pts</span>
                              <span className="text-[9px] text-slate-400 flex-shrink-0">
                                ({countUnlockedCharacteristics(unlockedPerks)})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const next = points + 1;
                                await updateCharacter(char.id, { characteristic_points: next });
                                showToast(`${char.characterName}: Pontos de Característica -> ${next}`);
                              }}
                              title="Conceder 1 ponto de característica"
                              className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-[10px] flex-shrink-0"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Perks Popover */}
                          {activePopover?.type === "perks" && activePopover.charId === char.id && (
                            <div
                              ref={popoverRef}
                              className={`absolute z-50 right-0 w-80 max-h-96 bg-[#0E121A] border border-white/20 rounded-2xl shadow-2xl p-3 space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 overflow-y-auto custom-scrollbar ${
                                isBottomRow ? "bottom-full mb-1.5" : "top-full mt-1.5"
                              }`}
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                <span className="text-[11px] font-mono text-slate-200 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  Licenças ({countUnlockedCharacteristics(unlockedPerks)}/{TOTAL_CHARACTERISTICS_COUNT})
                                </span>
                                <div className="flex items-center gap-2">
                                  {onOpenCharacteristicsModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActivePopover(null);
                                        onClose();
                                        onOpenCharacteristicsModal();
                                      }}
                                      className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
                                    >
                                      Auditoria ↗
                                    </button>
                                  )}
                                  <span className="text-[10px] font-mono text-amber-300">
                                    Saldo: {points} Pts
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3 pt-1">
                                {EOS_CHARACTERISTICS_CATEGORIES.map((cat) => (
                                  <div key={cat.id} className="space-y-1">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                      {cat.name}
                                    </span>
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {cat.items.map((item) => {
                                        if (item.type === "levels") {
                                          const curLvl = getCharacteristicLevel(unlockedPerks, item.id);
                                          return (
                                            <div
                                              key={item.id}
                                              className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1.5"
                                            >
                                              <div className="flex items-center justify-between text-[11px] font-mono">
                                                <span className="text-slate-200 font-bold truncate pr-1">
                                                  {item.name}
                                                </span>
                                                <span
                                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                                    curLvl > 0
                                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                      : "bg-white/5 text-slate-500"
                                                  }`}
                                                >
                                                  {curLvl > 0
                                                    ? `Nível ${ROMAN_LEVELS[curLvl - 1]} (${curLvl}/5)`
                                                    : "Sem Nível"}
                                                </span>
                                              </div>

                                              {/* Level Stepper Buttons: 0 to 5 */}
                                              <div className="grid grid-cols-6 gap-1 pt-0.5">
                                                {[0, 1, 2, 3, 4, 5].map((lvl) => {
                                                  const isSelected = curLvl === lvl;
                                                  const label = lvl === 0 ? "0" : ROMAN_LEVELS[lvl - 1];
                                                  return (
                                                    <button
                                                      key={lvl}
                                                      type="button"
                                                      onClick={async () => {
                                                        const nextList = setCharacteristicLevelInList(
                                                          unlockedPerks,
                                                          item.id,
                                                          lvl
                                                        );
                                                        await updateCharacter(char.id, {
                                                          unlocked_characteristics: nextList,
                                                        });
                                                        showToast(
                                                          `${char.characterName}: ${item.name} -> ${
                                                            lvl === 0 ? "Revogado" : `Nível ${label}`
                                                          }`
                                                        );
                                                      }}
                                                      className={`py-1 rounded text-[10px] font-mono font-bold transition-all text-center border cursor-pointer ${
                                                        isSelected
                                                          ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                                                          : "bg-black/30 hover:bg-white/10 text-slate-400 hover:text-white border-white/5"
                                                      }`}
                                                      title={
                                                        lvl === 0
                                                          ? "Revogar todos os níveis"
                                                          : `Definir Nível ${label}`
                                                      }
                                                    >
                                                      {label}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }

                                        // item.type === "benefits"
                                        const isUnlocked = unlockedPerks.includes(item.id);
                                        return (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={async () => {
                                              const nextList = isUnlocked
                                                ? unlockedPerks.filter((id) => id !== item.id)
                                                : [...unlockedPerks, item.id];
                                              await updateCharacter(char.id, {
                                                unlocked_characteristics: nextList,
                                              });
                                              showToast(
                                                `${char.characterName}: ${item.name} ${
                                                  isUnlocked ? "revogada" : "concedida"
                                                }`
                                              );
                                            }}
                                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-[11px] font-mono border transition-all ${
                                              isUnlocked
                                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold"
                                                : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                                            }`}
                                          >
                                            <span className="truncate pr-1">{item.name}</span>
                                            {isUnlocked ? (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
                                                Adquirido
                                              </span>
                                            ) : (
                                              <span className="text-[9px] text-slate-600">Bloqueado</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 8. Avisos (Cargas / Estoques) */}
                        <td className="px-2 py-2 text-left w-[10%]">
                          {alerts.length === 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[9px] font-mono font-semibold whitespace-nowrap">
                              <Check className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                              Abastecido
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {alerts.slice(0, 2).map((alertItem) => (
                                <span
                                  key={alertItem}
                                  className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold truncate max-w-full"
                                  title={`Estoque de ${alertItem} está zerado`}
                                >
                                  <AlertTriangle className="w-2 h-2 text-rose-400 flex-shrink-0" />
                                  <span className="truncate">{alertItem}</span>
                                </span>
                              ))}
                              {alerts.length > 2 && (
                                <span className="text-[8px] text-rose-400 font-mono">+{alerts.length - 2} alertas</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/50 flex items-center justify-between flex-shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Panóptico Global • Modificações refletem imediatamente na ficha dos jogadores</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl transition-colors font-bold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* ===================================================================
          MODAL PRIORITÁRIO DE SELEÇÃO DE PILARES (OVERLAY Z-[100])
          Garante paddings generosos, visibilidade total e sem corte do HUD
         =================================================================== */}
      {pillarSelector && (() => {
        const char = pillarSelector.char;
        const fac = getFaction(char.factionId);
        const isSat = pillarSelector.pillar === "satisfaction";
        const isEco = pillarSelector.pillar === "economy";
        const isMil = pillarSelector.pillar === "military";

        const currentLvl = isSat
          ? (char.satisfaction ?? 2)
          : isEco
          ? (char.economy ?? 2)
          : (char.military ?? 2);

        const title = isSat
          ? "Satisfação da População"
          : isEco
          ? "Economia & Abastecimento"
          : "Poderio Militar";

        const subtitle = isSat
          ? "Mede o contentamento civil, a coesão social e a estabilidade governamental desta facção."
          : isEco
          ? "Mede a capacidade logística, equilíbrio de suprimentos e saúde financeira das colônias."
          : "Mede o estado e prontidão operacional das forças armadas da facção no sistema.";

        const levels = isSat
          ? SATISFACTION_LEVELS
          : isEco
          ? ECONOMY_LEVELS
          : MILITARY_LEVELS;

        const loreDescriptions: Record<string, Record<number, string>> = {
          satisfaction: {
            4: "Excelente: População inspirada e leal. Máxima coesão social e ordem pública inabalável.",
            3: "Estável: Apoio popular sólido. Colônias produtivas sem atritos civis relevantes.",
            2: "Neutra: Equilíbrio funcional. Cidadãos cooperam no padrão sem entusiasmo ou protestos.",
            1: "Tensa: Murmúrios de descontentamento. Reclamações contra medidas e atrito social perceptível.",
            0: "Colapso: Revoltas civis generalizadas, greves massivas e risco iminente de motim.",
          },
          economy: {
            4: "Abundante: Superávit vigoroso, infraestrutura impecável e comércio galáctico próspero.",
            3: "Suficiente: Cadeias de suprimento equilibradas, consumo estável e sem gargalos logísticos.",
            2: "Neutra: Recursos básicos atendidos estritamente, sem folgas para despesas supérfluas.",
            1: "Racionamento: Escassez de insumos, inflação de créditos e tensão nas linhas de suprimento.",
            0: "Fome: Desabastecimento catastrófico, paralisação industrial e crise humanitária aguda.",
          },
          military: {
            4: "Supremacia: Forças armadas temidas, frotas em prontidão máxima e domínio hegemônico.",
            3: "Seguro: Defesas coordenadas, patrulhas ativas e capacidade pronta de resposta tática.",
            2: "Neutro: Contingente regular suficiente para manter a ordem e a defesa básica.",
            1: "Pressionado: Contingente desfalcado, perdas materiais recentes e dificuldade de reposição.",
            0: "Dizimado: Ruína militar completa. Sem capacidade defensiva, território indefeso.",
          },
        };

        const descriptions = loreDescriptions[pillarSelector.pillar];

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setPillarSelector(null)}
          >
            <div
              className="relative w-full max-w-xl bg-[#0B0F17] border border-white/20 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{ backgroundColor: fac.color }}
                    />
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ color: fac.color }}
                    >
                      {fac.name}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs font-mono text-slate-300">
                      {char.characterName} ({char.leaderTitle})
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white font-sans flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    {title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed">
                    {subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setPillarSelector(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Fechar Seletor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Levels Selection List (Padded Buttons with Generous Spacing) */}
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {[...levels].reverse().map((lvl) => {
                  const isCurrent = currentLvl === lvl.level;
                  const desc = descriptions[lvl.level];

                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={async () => {
                        await updateCharacter(char.id, { [pillarSelector.pillar]: lvl.level });
                        showToast(`${char.characterName}: ${title} -> ${lvl.label}`);
                        setPillarSelector(null);
                      }}
                      className={`w-full p-4 rounded-2xl text-left font-mono transition-all border flex items-start justify-between gap-3 cursor-pointer group ${
                        isCurrent
                          ? "bg-white/10 border-white/40 ring-2 ring-white/20 shadow-lg scale-[1.01]"
                          : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/20 hover:scale-[1.01]"
                      }`}
                      style={{
                        borderColor: isCurrent ? lvl.color : undefined,
                      }}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: lvl.color }}
                          />
                          <span
                            className="text-sm font-bold tracking-wide"
                            style={{ color: lvl.color }}
                          >
                            Nível {lvl.level}: {lvl.label}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {desc}
                        </p>
                      </div>

                      <div className="flex-shrink-0 pt-0.5">
                        {isCurrent ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-black font-bold"
                            style={{ backgroundColor: lvl.color }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/20 group-hover:border-white/50 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Close / Confirm Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono text-slate-400">
                <span>Clique em qualquer nível para aplicar instantaneamente</span>
                <button
                  type="button"
                  onClick={() => setPillarSelector(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors font-bold cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
