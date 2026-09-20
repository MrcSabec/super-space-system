"use client";

import React, { useState } from "react";
import {
  MousePointer,
  PlusCircle,
  Triangle,
  Square,
  Crown,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Grid,
  Radio,
  Eye,
  EyeOff,
  Users,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Move,
  Check,
  AlertTriangle,
  Sliders,
  Handshake,
  HelpCircle,
  Settings,
} from "lucide-react";
import { FactionId, Troop, TroopClass } from "@/types/sss";
import { PLAYABLE_FACTIONS_LIST, getFaction } from "@/lib/factions";

export type MapTool = "navigate" | "select" | "add_planet" | "add_troop";

export interface TroopClassOption {
  id: TroopClass;
  label: string;
  shapeDescription: string;
  isVehicle: boolean;
  canFly: boolean;
}

export const TROOP_CLASSES: TroopClassOption[] = [
  {
    id: "light_infantry",
    label: "Infantaria Leve",
    shapeDescription: "Quadrado Pequeno",
    isVehicle: false,
    canFly: false,
  },
  {
    id: "heavy_infantry",
    label: "Infantaria Pesada",
    shapeDescription: "Quadrado Médio",
    isVehicle: false,
    canFly: false,
  },
  {
    id: "light_vehicle",
    label: "Veículo Leve",
    shapeDescription: "Triângulo Pequeno",
    isVehicle: true,
    canFly: false,
  },
  {
    id: "heavy_vehicle",
    label: "Veículo Pesado",
    shapeDescription: "Triângulo Médio",
    isVehicle: true,
    canFly: false,
  },
  {
    id: "elite",
    label: "Unidade de Elite",
    shapeDescription: "Forma Grande (Planeta)",
    isVehicle: true,
    canFly: true,
  },
];

interface MapControlsProps {
  activeTool: MapTool;
  onSelectTool: (tool: MapTool) => void;
  selectedFactionForAdd: FactionId;
  onSelectFactionForAdd: (fid: FactionId) => void;

  // Pre-configuration for troop stamp
  selectedTroopClass: TroopClass;
  onSelectTroopClass: (cls: TroopClass) => void;
  isAirspace: boolean;
  onToggleAirspace: (air: boolean) => void;
  payloadCount: number;
  onChangePayloadCount: (count: number) => void;

  // Troop mobilization quotas & lore flavors
  troopQuotas?: Record<TroopClass, { placed: number; max: number; available: number }>;
  factionTroopFlavors?: {
    lightInfantry?: string;
    heavyInfantry?: string;
    lightVehicles?: string;
    heavyVehicles?: string;
    eliteUnits?: string;
  };

  // Selected troop management (Fog of War & Payload edit)
  selectedTroop: Troop | null;
  onUpdateSelectedTroop?: (updated: Troop) => void;
  onDeleteSelectedTroop?: (id: string) => void;
  onDeselectTroop?: () => void;
  campaignFactions?: FactionId[];

  // Viewport & Settings
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoomLevel: number;
  isGM: boolean;
  currentUserFactionId?: FactionId;
  isLiveSynced?: boolean;
  isLiveMode?: boolean;
  onToggleLiveMode?: () => void;
  onOpenEmpiresModal?: () => void;
  onOpenDiplomacyModal?: () => void;
  viewAs?: "global" | FactionId;
  onChangeViewAs?: (viewAs: "global" | FactionId) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  activeTool,
  onSelectTool,
  selectedFactionForAdd,
  onSelectFactionForAdd,
  selectedTroopClass,
  onSelectTroopClass,
  isAirspace,
  onToggleAirspace,
  payloadCount,
  onChangePayloadCount,
  troopQuotas,
  factionTroopFlavors,
  selectedTroop,
  onUpdateSelectedTroop,
  onDeleteSelectedTroop,
  onDeselectTroop,
  campaignFactions = [],
  onZoomIn,
  onZoomOut,
  onResetView,
  showGrid,
  onToggleGrid,
  zoomLevel,
  isGM,
  currentUserFactionId,
  isLiveSynced = true,
  isLiveMode = true,
  onToggleLiveMode,
  onOpenEmpiresModal,
  onOpenDiplomacyModal,
  viewAs = "global",
  onChangeViewAs,
}) => {
  const currentAddFaction = getFaction(
    isGM ? selectedFactionForAdd : currentUserFactionId || "neutral"
  );

  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const isRevealedToAll = (list?: string[]): boolean => {
    if (!list) return false;
    return list.some((item) => {
      const s = String(item).toLowerCase();
      return s === "all" || s === "todos";
    });
  };

  // Handle Fog of War toggle for a specific faction or "all"
  const handleToggleVisibility = (target: "all" | FactionId) => {
    if (!selectedTroop || !onUpdateSelectedTroop) return;
    const currentList = selectedTroop.visible_to || ["dm", selectedTroop.ownerId || "", selectedTroop.factionId];

    let nextList: string[];
    if (target === "all") {
      if (isRevealedToAll(currentList)) {
        nextList = currentList.filter((item) => {
          const s = String(item).toLowerCase();
          return s !== "all" && s !== "todos";
        });
        if (!nextList.includes("dm")) nextList.push("dm");
        if (selectedTroop.ownerId && !nextList.includes(selectedTroop.ownerId)) {
          nextList.push(selectedTroop.ownerId);
        }
      } else {
        nextList = Array.from(new Set([...currentList, "all", "Todos"]));
      }
    } else {
      if (currentList.includes(target)) {
        nextList = currentList.filter((item) => item !== target);
        if (!nextList.includes("dm")) nextList.push("dm");
        if (selectedTroop.ownerId && !nextList.includes(selectedTroop.ownerId)) {
          nextList.push(selectedTroop.ownerId);
        }
      } else {
        nextList = Array.from(new Set([...currentList, target]));
      }
    }

    onUpdateSelectedTroop({
      ...selectedTroop,
      visible_to: nextList,
    });
  };

  // Handle Payload count update on existing selected troop
  const handleUpdateTroopPayload = (count: number) => {
    if (!selectedTroop || !onUpdateSelectedTroop) return;
    onUpdateSelectedTroop({
      ...selectedTroop,
      payload: Math.max(0, count),
    });
  };

  const isVehicleOrAir =
    selectedTroopClass === "light_vehicle" ||
    selectedTroopClass === "heavy_vehicle" ||
    (selectedTroopClass === "elite" && isAirspace);

  const availableFactions =
    campaignFactions.length > 0
      ? PLAYABLE_FACTIONS_LIST.filter((f) => campaignFactions.includes(f.id))
      : PLAYABLE_FACTIONS_LIST;

  return (
    <>
      <div
        data-hud="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="hud-element absolute top-4 left-4 z-40 flex flex-col gap-2.5 pointer-events-none select-none max-w-xs sm:max-w-sm cursor-default"
      >
      {/* ===================================================================
          1. MAIN TOOLBOX
         =================================================================== */}
      <div className="flex flex-col bg-[#0A0D14]/75 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-auto overflow-hidden transition-all duration-200">
        {/* Header / Status */}
        <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentAddFaction.color }}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
              {isGM ? "Mestre • Ferramentas" : `Tático • ${currentAddFaction.shortName}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* GM Live vs Blueprint Mode Toggle Switch */}
            {isGM && onToggleLiveMode ? (
              <button
                type="button"
                onClick={onToggleLiveMode}
                title={
                  isLiveMode
                    ? "Modo LIVE ativo: Sincronização imediata no Firestore. Clique para alternar para Modo BLUEPRINT (Rascunho)."
                    : "Modo BLUEPRINT ativo: Edições locais em rascunho. Clique para alternar para Modo LIVE."
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm ${
                  isLiveMode
                    ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50"
                }`}
              >
                {isLiveMode ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>((o)) LIVE</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-3 h-3 text-amber-400 animate-spin-slow" />
                    <span>⚙️ BLUEPRINT</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1 mr-1" title="Sincronização em tempo real">
                <Radio
                  className={`w-3 h-3 ${
                    isLiveSynced ? "text-emerald-400 animate-pulse" : "text-amber-400"
                  }`}
                />
                <span className="text-[9px] font-mono text-slate-400">
                  {isLiveSynced ? "LIVE" : "LOCAL"}
                </span>
              </div>
            )}

            {/* Discreet Help [ ? ] Button with Hover Popover */}
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
                onClick={() => setShowHelp((prev) => !prev)}
                title="Ajuda e Instruções Táticas"
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 text-slate-400 hover:text-sky-300 border border-white/10 hover:border-sky-400/40 transition-colors cursor-pointer"
              >
                ?
              </button>

              {showHelp && (
                <div className="absolute z-50 top-full right-0 mt-2 w-64 p-3 bg-[#0A0D14]/95 border border-sky-500/40 rounded-2xl shadow-2xl backdrop-blur-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-white/10 text-sky-300 text-xs font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Atalhos & Controles Táticos</span>
                  </div>
                  <ul className="text-[11px] font-mono text-slate-300 space-y-1.5 leading-relaxed">
                    <li><strong className="text-white">Navegar:</strong> Arraste o vácuo espacial livre para se deslocar.</li>
                    <li><strong className="text-white">Mover:</strong> Clique em uma tropa e arraste para reposicioná-la.</li>
                    <li><strong className="text-white">+ Tropa:</strong> Clique no espaço do mapa para carimbar a unidade.</li>
                    <li><strong className="text-rose-300">Excluir:</strong> Selecione e tecle Delete/Backspace ou clique em Excluir.</li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsToolboxCollapsed((prev) => !prev)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/5 cursor-pointer"
            >
              {isToolboxCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* GM Vision Filter (Fog of War Simulator) */}
        {isGM && onChangeViewAs && (
          <div className="px-3 py-1.5 bg-black/60 border-b border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono flex-shrink-0">
              <Eye
                className={`w-3.5 h-3.5 ${
                  viewAs !== "global"
                    ? "text-amber-400 animate-pulse"
                    : "text-slate-400"
                }`}
              />
              <span className="text-[11px] font-bold tracking-tight">Visão:</span>
            </div>

            <div className="relative flex-1 min-w-0">
              <select
                value={viewAs || "global"}
                onChange={(e) => onChangeViewAs(e.target.value as "global" | FactionId)}
                aria-label="Filtro de Visão do Mestre"
                className={`w-full text-[11px] font-mono font-medium py-1 pl-2 pr-6 rounded-lg border transition-all cursor-pointer outline-none appearance-none truncate ${
                  viewAs !== "global"
                    ? "bg-amber-500/20 border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold"
                    : "bg-black/60 border-white/10 text-slate-200 hover:border-white/25 hover:bg-black/80"
                }`}
                style={
                  viewAs !== "global"
                    ? {
                        borderColor: getFaction(viewAs).color,
                        color: getFaction(viewAs).color,
                      }
                    : undefined
                }
              >
                <option value="global" className="bg-[#0D111A] text-slate-100">
                  Global (Mestre)
                </option>
                {PLAYABLE_FACTIONS_LIST.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#0D111A] text-slate-100">
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {!isToolboxCollapsed && (
          <div className="p-2 space-y-2 max-h-[80vh] overflow-y-auto">
            {/* Pure Iconographic Toolbar (Figma/Photoshop Style) */}
            <div className="flex items-center justify-center gap-1 p-1 bg-black/40 border border-white/5 rounded-xl">
              {/* Tool 1: Navigate */}
              <button
                type="button"
                onClick={() => onSelectTool("navigate")}
                title="Navegar no Mapa (arraste livre pelo vácuo espacial)"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTool === "navigate"
                    ? "bg-white/20 text-white shadow-inner font-bold border border-white/30"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Move className="w-4 h-4 text-sky-400" />
              </button>

              {/* Tool 2: Select & Move */}
              <button
                type="button"
                onClick={() => onSelectTool("select")}
                title="Mover e Selecionar Tropas (clique para inspecionar, arraste para reposicionar)"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTool === "select"
                    ? "bg-sky-500/25 text-sky-200 shadow-inner font-bold border border-sky-500/50"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <MousePointer className="w-4 h-4 text-sky-300" />
              </button>

              {/* Tool 3: Stamp Troop */}
              <button
                type="button"
                onClick={() => onSelectTool("add_troop")}
                title="Carimbar Novas Tropas (+ Tropa)"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTool === "add_troop"
                    ? "bg-amber-500/25 text-amber-200 border border-amber-500/50 font-bold shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Triangle className="w-4 h-4 text-amber-400" />
              </button>

              {/* Tool 4: GM Add Planet */}
              {isGM && (
                <button
                  type="button"
                  onClick={() => onSelectTool("add_planet")}
                  title="+ Adicionar Planeta Orbital (Mestre)"
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    activeTool === "add_planet"
                      ? "bg-sky-500/25 text-sky-200 border border-sky-500/50 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-sky-400" />
                </button>
              )}

              {/* Divider for GM utilities if GM */}
              {isGM && (onOpenEmpiresModal || onOpenDiplomacyModal) && (
                <div className="w-[1px] h-5 bg-white/10 mx-0.5" />
              )}

              {/* Tool 5: GM Panóptico / Impérios */}
              {isGM && onOpenEmpiresModal && (
                <button
                  type="button"
                  onClick={onOpenEmpiresModal}
                  title="Panóptico: Controle de Impérios e Fichas"
                  className="p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/15 border border-transparent hover:border-amber-400/30 transition-all cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}

              {/* Tool 6: GM Diplomacia */}
              {isGM && onOpenDiplomacyModal && (
                <button
                  type="button"
                  onClick={onOpenDiplomacyModal}
                  title="Matriz de Gestão Diplomática Global"
                  className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-400/15 border border-transparent hover:border-sky-400/30 transition-all cursor-pointer"
                >
                  <Handshake className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ===============================================================
                IN-TOOLBOX PRE-CONFIGURATION FOR TROOP INSERTION (NO POP-UPS!)
               =============================================================== */}
            {activeTool === "add_troop" && (
              <div className="p-2.5 bg-black/40 border border-amber-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Configurar Tropa (Carimbo)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">Sem pop-ups</span>
                </div>

                {/* Troop Class Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 block">
                    Classe Geométrica:
                  </label>
                  <div className="grid grid-cols-1 gap-1">
                    {TROOP_CLASSES.map((cls) => {
                      const isSelected = selectedTroopClass === cls.id;
                      const quota = troopQuotas?.[cls.id];
                      const isExhausted = isGM ? false : quota ? quota.available <= 0 : false;
                      const flavor = factionTroopFlavors?.[
                        cls.id === "light_infantry"
                          ? "lightInfantry"
                          : cls.id === "heavy_infantry"
                          ? "heavyInfantry"
                          : cls.id === "light_vehicle"
                          ? "lightVehicles"
                          : cls.id === "heavy_vehicle"
                          ? "heavyVehicles"
                          : "eliteUnits"
                      ];

                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => onSelectTroopClass(cls.id)}
                          className={`w-full p-2 rounded-lg text-left text-xs font-mono flex items-center justify-between border transition-all ${
                            isSelected
                              ? isExhausted
                                ? "bg-rose-950/40 border-rose-500/50 text-white font-bold shadow-sm"
                                : "bg-white/15 border-white/40 text-white font-bold shadow-sm"
                              : isExhausted
                              ? "bg-black/40 border-rose-500/20 text-slate-400 opacity-60 hover:opacity-90"
                              : "bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              {cls.id === "light_infantry" && (
                                <Square className="w-3 h-3 text-sky-400 fill-sky-400/40" />
                              )}
                              {cls.id === "heavy_infantry" && (
                                <Square className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/50" />
                              )}
                              {cls.id === "light_vehicle" && (
                                <Triangle className="w-3 h-3 text-amber-400 fill-amber-400/40" />
                              )}
                              {cls.id === "heavy_vehicle" && (
                                <Triangle className="w-3.5 h-3.5 text-rose-400 fill-rose-400/50" />
                              )}
                              {cls.id === "elite" && (
                                <Crown className="w-3.5 h-3.5 text-amber-300" />
                              )}
                              <span className="truncate">{cls.label}</span>
                            </div>
                            {flavor && (
                              <p className="text-[9px] text-slate-400 font-mono truncate pl-5">
                                {flavor}
                              </p>
                            )}
                          </div>

                          {isGM ? (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                {quota?.placed ?? 0} / ∞
                              </span>
                              <span className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[8px] font-mono">
                                ∞ disp.
                              </span>
                            </div>
                          ) : quota ? (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  isExhausted ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {quota.placed}/{quota.max}
                              </span>
                              {isExhausted ? (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-mono uppercase font-bold">
                                  Esgotado
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[8px] font-mono">
                                  {quota.available} disp.
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-normal">
                              {cls.shapeDescription.split(" ")[0]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!isGM && troopQuotas?.[selectedTroopClass]?.available === 0 && (
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[10px] font-mono flex items-start gap-1.5 animate-in fade-in duration-150 mt-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Limite de mobilização atingido ({troopQuotas[selectedTroopClass].placed}/{troopQuotas[selectedTroopClass].max}):</strong> Todas as tropas desta classe computadas na ficha já estão no mapa.
                      </span>
                    </div>
                  )}
                </div>

                {/* If Elite: Airspace Flag Toggle (Large Triangle vs Large Square) */}
                {selectedTroopClass === "elite" && (
                  <div className="p-2 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-300 block">
                      Ambiente de Operação da Elite:
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleAirspace(false)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all flex items-center justify-center gap-1.5 border ${
                          !isAirspace
                            ? "bg-sky-500/20 text-sky-200 border-sky-500/40 font-bold"
                            : "bg-black/20 text-slate-400 border-transparent hover:text-white"
                        }`}
                      >
                        <Square className="w-3 h-3" />
                        <span>Terrestre (■)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleAirspace(true)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all flex items-center justify-center gap-1.5 border ${
                          isAirspace
                            ? "bg-amber-500/20 text-amber-200 border-amber-500/40 font-bold"
                            : "bg-black/20 text-slate-400 border-transparent hover:text-white"
                        }`}
                      >
                        <Triangle className="w-3 h-3" />
                        <span>Aéreo (▲)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Transport Mechanic: Payload input for vehicles & aerial elite */}
                {isVehicleOrAir && (
                  <div className="p-2 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                    <div className="truncate">
                      <label className="text-[10px] font-mono text-slate-300 block font-bold">
                        Embarcados:
                      </label>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        Infantaria no veículo
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onChangePayloadCount(Math.max(0, payloadCount - 1))}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={payloadCount}
                        onChange={(e) =>
                          onChangePayloadCount(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-10 px-1 py-1 bg-black/60 border border-white/20 rounded text-center text-xs font-mono font-bold text-amber-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onChangePayloadCount(payloadCount + 1)}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Faction selector (for GM only, player is locked to their faction) */}
                {isGM ? (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Facção da Tropa:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PLAYABLE_FACTIONS_LIST.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onSelectFactionForAdd(f.id)}
                          title={f.name}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            selectedFactionForAdd === f.id
                              ? "scale-125 border-white shadow-md ring-2 ring-white/20"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: f.color }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => onSelectFactionForAdd("neutral")}
                        title="Neutro / Mestre"
                        className={`w-5 h-5 rounded-full border bg-slate-300 transition-transform ${
                          selectedFactionForAdd === "neutral"
                            ? "scale-125 border-white shadow-md ring-2 ring-white/20"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400 border-t border-white/5">
                    <span>Facção:</span>
                    <span
                      className="font-bold flex items-center gap-1"
                      style={{ color: currentAddFaction.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: currentAddFaction.color }}
                      />
                      {currentAddFaction.shortName}
                    </span>
                  </div>
                )}

                {/* Stamp Action Hint */}
                <p className="text-[10px] font-mono text-amber-300/90 text-center pt-0.5">
                  Clique no vácuo do mapa para posicionar
                </p>
              </div>
            )}

            {/* Planet preset for GM */}
            {isGM && activeTool === "add_planet" && (
              <div className="p-2 bg-black/40 border border-sky-500/30 rounded-xl space-y-1.5">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Facção do Planeta:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PLAYABLE_FACTIONS_LIST.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFactionForAdd(f.id)}
                      title={f.name}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        selectedFactionForAdd === f.id
                          ? "scale-125 border-white shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: f.color }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => onSelectFactionForAdd("neutral")}
                    title="Neutro / Mestre"
                    className={`w-5 h-5 rounded-full border bg-slate-300 transition-transform ${
                      selectedFactionForAdd === "neutral"
                        ? "scale-125 border-white shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-sky-300 font-mono text-center pt-1">
                  Clique no espaço aberto do mapa para posicionar o planeta orbital
                </p>
              </div>
            )}
          </div>
        )}

        {/* Viewport & Navigation controls (Always visible in bottom bar) */}
        <div className="flex items-center justify-between p-1.5 border-t border-white/5 bg-black/40">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onZoomIn}
              title="Aproximar Zoom"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              title="Afastar Zoom"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onResetView}
              title="Centralizar na Estrela (0,0)"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleGrid}
              title="Alternar Grade Espacial"
              className={`p-1.5 rounded-lg transition-colors ${
                showGrid
                  ? "text-sky-400 bg-sky-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mr-2">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>
    </div>

      {/* ===================================================================
          2. SELECTED TROOP INSPECTION & FOG OF WAR (DEDICATED TOP-RIGHT PANEL)
         =================================================================== */}
      {selectedTroop && (
        <div
          data-hud="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="hud-element fixed sm:absolute top-4 right-4 z-40 w-[calc(100vw-2rem)] sm:w-80 md:w-88 max-h-[calc(100vh-5rem)] flex flex-col bg-[#0C0F17]/95 border border-sky-500/40 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-auto overflow-hidden animate-in slide-in-from-top-2 duration-200 cursor-default"
        >
          {/* Pinned Header: Unit Title + Instant Delete Button + Close Button */}
          <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-white/10 bg-black/40 flex-shrink-0">
            <div className="flex items-center gap-2 truncate pr-2">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: getFaction(selectedTroop.factionId).color }}
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {selectedTroop.name}
                </h4>
                <p className="text-[9px] font-mono text-slate-400 truncate">
                  {TROOP_CLASSES.find((c) => c.id === selectedTroop.troopClass)?.label ||
                    "Tropa Militar"}{" "}
                  • Coord: ({Math.round(selectedTroop.x)}, {Math.round(selectedTroop.y)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onDeleteSelectedTroop && (
                <button
                  type="button"
                  onClick={() => onDeleteSelectedTroop(selectedTroop.id)}
                  title="Excluir esta tropa do mapa"
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-rose-100 border border-rose-500/40 hover:border-rose-500/70 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Excluir</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDeselectTroop}
                title="Desmarcar tropa (Voltar ao mapa)"
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
            {/* Quick instructions for user */}
            <div className="p-2 bg-black/40 rounded-xl text-[10px] font-mono text-slate-400 flex items-center justify-between border border-white/5">
              <span className="flex items-center gap-1 text-sky-300">
                <Move className="w-3 h-3" /> Arraste para mover
              </span>
              <button
                type="button"
                onClick={onDeselectTroop}
                className="text-[9px] text-slate-400 hover:text-white underline"
              >
                Desmarcar (ou clique no mapa)
              </button>
            </div>

            {/* Transport payload editor (if vehicle or aerial) */}
            {(selectedTroop.troopClass === "light_vehicle" ||
              selectedTroop.troopClass === "heavy_vehicle" ||
              (selectedTroop.troopClass === "elite" && selectedTroop.is_airspace)) && (
              <div className="p-2 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-300 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>Embarcados:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateTroopPayload(Math.max(0, (selectedTroop.payload || 0) - 1))
                    }
                    className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={selectedTroop.payload || 0}
                    onChange={(e) =>
                      handleUpdateTroopPayload(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-10 px-1 py-0.5 bg-black/60 border border-white/20 rounded text-center text-xs font-mono font-bold text-amber-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateTroopPayload((selectedTroop.payload || 0) + 1)}
                    className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* FOG OF WAR / VISIBILITY PERMISSIONS CONTROLS */}
            <div className="p-2 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-sky-400" />
                  Névoa de Guerra (Visibilidade)
                </span>
                {isRevealedToAll(selectedTroop.visible_to) ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    Visível a Todos
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Oculta / Privada
                  </span>
                )}
              </div>

              {/* Quick Toggle Button: Revelar Tropa para Todos */}
              <button
                type="button"
                onClick={() => handleToggleVisibility("all")}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all ${
                  isRevealedToAll(selectedTroop.visible_to)
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30"
                    : "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25"
                }`}
              >
                {isRevealedToAll(selectedTroop.visible_to) ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar dos Adversários</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Revelar Tropa (Todos)</span>
                  </>
                )}
              </button>

              {/* Faction Checkboxes for selective revelation */}
              <div className="pt-1.5 border-t border-white/5 space-y-1">
                <p className="text-[9px] font-mono text-slate-400">
                  Ou selecione facções específicas:
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-0.5">
                  {availableFactions.map((f) => {
                    const isVisibleToFaction =
                      isRevealedToAll(selectedTroop.visible_to) ||
                      (selectedTroop.visible_to || []).includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleVisibility(f.id)}
                        className={`p-1.5 rounded-lg border text-left text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                          isVisibleToFaction
                            ? "bg-white/10 border-white/30 text-slate-200 font-semibold"
                            : "bg-black/20 border-white/5 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: f.color }}
                        />
                        <span className="truncate">{f.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fixed Footer Action with Full-Width Delete Button */}
          {onDeleteSelectedTroop && (
            <div className="p-2.5 border-t border-white/10 bg-black/50 flex-shrink-0">
              <button
                type="button"
                onClick={() => onDeleteSelectedTroop(selectedTroop.id)}
                className="w-full py-2 px-3 text-xs font-mono font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-500/60 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Excluir Tropa do Mapa</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
