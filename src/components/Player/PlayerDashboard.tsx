"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlayerCharacter,
  Campaign,
  MapState,
  ResourceKey,
  QualitativeResource,
} from "@/types/sss";
import { getFaction } from "@/lib/factions";
import { getFactionTraits, FactionTrait } from "@/lib/factionTraits";
import {
  PILLAR_4_TITLES,
  PILLAR_4_LEVELS,
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
  getOtherPlayableFactions,
  getDiplomaticStatus,
  DIPLOMATIC_STATUS_CONFIG,
} from "@/lib/diplomacy";
import { ResourceMeterGrid } from "@/components/Resources/ResourceMeterGrid";
import { StarMapCanvas } from "@/components/StarMap/StarMapCanvas";
import { CommandNotepadDrawer } from "./CommandNotepadDrawer";
import { KnowledgeCatalog } from "./KnowledgeCatalog";
import { saveMapState, saveMapTroops } from "@/lib/db";
import {
  Crown,
  Zap,
  AlertTriangle,
  Coins,
  Sparkles,
  Plus,
  Handshake,
  Trash2,
  ChevronDown,
  ChevronUp,
  Orbit,
  Check,
  FileText,
  Activity,
  X,
  Lock,
  Radio,
  Building2,
  Users,
  Swords,
  DollarSign,
  Package,
  Droplets,
  Wheat,
  Bug,
  Layers,
  Shield,
  Gem,
  Radiation,
  Flame,
  BookOpen,
} from "lucide-react";

interface PlayerDashboardProps {
  campaign: Campaign;
  character: PlayerCharacter;
  mapState: MapState;
  onUpdateCharacter: (updated: PlayerCharacter) => Promise<void>;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  campaign,
  character,
  mapState,
  onUpdateCharacter,
}) => {
  const faction = getFaction(character.factionId);
  const traits: FactionTrait[] = getFactionTraits(character.factionId);
  const pillar4Title = PILLAR_4_TITLES[character.factionId] || "A Federação";
  const census = FACTION_INITIAL_CENSUS[character.factionId] || FACTION_INITIAL_CENSUS.federation;

  // Local mirror state for immediate responsiveness on player-editable fields
  const [credits, setCredits] = useState(character.galacticCredits ?? census.credits);
  const [population, setPopulation] = useState(character.populationCount ?? census.population);
  const [resources, setResources] = useState<Record<ResourceKey, QualitativeResource>>(() =>
    normalizeCharacterResources(character, character.factionId)
  );

  const [artifacts, setArtifacts] = useState<string[]>(character.precursorArtifacts || []);
  const [isArtifactsExpanded, setIsArtifactsExpanded] = useState<boolean>(
    (character.precursorArtifacts || []).length > 0
  );
  const [expandedTraits, setExpandedTraits] = useState<Record<string, boolean>>({});

  // Debounce saving state for Vault
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsible tactical map drawer in HUD view
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);

  // Slide-over command notepad drawer (client-side only state)
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);

  // Active main tab: Overview (Ficha) vs Characteristics (Metagaming Perks / Knowledge)
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "characteristics">("overview");

  // Sync incoming character updates from real-time Firestore stream
  useEffect(() => {
    setCredits(character.galacticCredits ?? census.credits);
    setPopulation(character.populationCount ?? census.population);
    setResources(normalizeCharacterResources(character, character.factionId));
    setArtifacts(character.precursorArtifacts || []);
  }, [character, census]);

  // Debounced auto-save function for player editable data (Turn Diary & Vault)
  const triggerDebouncedSave = useCallback(
    (partialUpdates: Partial<PlayerCharacter>) => {
      setSaveStatus("saving");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await onUpdateCharacter({
            ...character,
            ...partialUpdates,
          });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Failed to auto-save character:", err);
          setSaveStatus("saved");
        }
      }, 1000); // 1 second debounce
    },
    [character, onUpdateCharacter]
  );

  // Credits modifier buttons
  const handleModifyCredits = (delta: number) => {
    const newCredits = Math.max(0, credits + delta);
    setCredits(newCredits);
    triggerDebouncedSave({ galacticCredits: newCredits });
  };

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const safeVal = Math.max(0, val);
    setCredits(safeVal);
    triggerDebouncedSave({ galacticCredits: safeVal });
  };

  // Demographics: Population handlers
  const handleModifyPopulation = (delta: number) => {
    const next = Math.max(0, population + delta);
    setPopulation(next);
    triggerDebouncedSave({ populationCount: next });
  };

  const handlePopulationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const safeVal = Math.max(0, val);
    setPopulation(safeVal);
    triggerDebouncedSave({ populationCount: safeVal });
  };

  // Artifacts management
  const handleAddArtifact = () => {
    const updated = [...artifacts, ""];
    setArtifacts(updated);
    triggerDebouncedSave({ precursorArtifacts: updated });
  };

  const handleUpdateArtifact = (index: number, value: string) => {
    const updated = [...artifacts];
    updated[index] = value;
    setArtifacts(updated);
    triggerDebouncedSave({ precursorArtifacts: updated });
  };

  const handleRemoveArtifact = (index: number) => {
    const updated = artifacts.filter((_, i) => i !== index);
    setArtifacts(updated);
    triggerDebouncedSave({ precursorArtifacts: updated });
  };

  // Toggle trait accordion
  const toggleTrait = (id: string) => {
    setExpandedTraits((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full h-full bg-[#08090C] text-[#E0E6ED] overflow-y-auto relative">
      {/* Dynamic Background Aura reflecting faction's pastel color */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: faction.color }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-24">
        {/* ===================================================================
            NAVEGAÇÃO PRINCIPAL DO DASHBOARD (STATE B): FICHA vs CARACTERÍSTICAS vs DIÁRIO
           =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border shadow-sm cursor-pointer ${
                activeMainTab === "overview"
                  ? "shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15"
              }`}
              style={
                activeMainTab === "overview"
                  ? {
                      backgroundColor: faction.bgGlow,
                      borderColor: `${faction.color}60`,
                      color: faction.color,
                    }
                  : undefined
              }
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Visão Geral (Ficha)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("characteristics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border shadow-sm cursor-pointer ${
                activeMainTab === "characteristics"
                  ? "shadow-md ring-1 ring-amber-400/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15"
              }`}
              style={
                activeMainTab === "characteristics"
                  ? {
                      backgroundColor: faction.bgGlow,
                      borderColor: `${faction.color}60`,
                      color: faction.color,
                    }
                  : undefined
              }
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  activeMainTab === "characteristics" ? "text-amber-300" : "text-amber-400"
                }`}
              />
              <span>Características & Conhecimento</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors bg-amber-400/15 text-amber-300 border-amber-400/30 shadow-sm">
                Pontos: {character.characteristic_points ?? 2}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotepadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Diário / Anotações</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                Tablet Lateral
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            COMPONENT 1: HEADER DE IDENTIDADE E TAGS
           =================================================================== */}
        <section
          className="relative bg-[#0E1118]/85 border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300"
          style={{ borderColor: `${faction.color}35` }}
        >
          {/* Top colored accent border line */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: faction.color }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Geometric Faction Icon + Name & Auto-Title */}
            <div className="flex items-start md:items-center gap-4">
              {/* Geometric Faction Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: faction.bgGlow,
                  borderColor: `${faction.color}60`,
                  boxShadow: `0 0 25px ${faction.bgGlow}`,
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={faction.color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  <polygon
                    points="24,10 36,34 12,34"
                    fill={faction.color}
                    opacity="0.85"
                  />
                  <circle cx="24" cy="26" r="3" fill="#08090C" />
                </svg>
              </div>

              {/* Leader Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border"
                    style={{
                      backgroundColor: faction.bgGlow,
                      color: faction.color,
                      borderColor: `${faction.color}40`,
                    }}
                  >
                    {character.leaderTitle}
                  </span>
                  <span className="text-xs font-mono text-slate-500">• {faction.name}</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight mt-1">
                  {character.characterName}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Setor: {campaign.name} • Comandante: @{character.username}
                </p>
              </div>
            </div>

            {/* Right: Quick Tactical Map Toggle Button & Save Status */}
            <div className="flex items-center gap-3">
              {/* Auto-save status indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl text-xs font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    saveStatus === "saving" ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                  }`}
                />
                <span className="text-slate-400 text-[11px]">
                  {saveStatus === "saving" ? "Sincronizando..." : "Sincronizado"}
                </span>
              </div>

              {/* Quick shortcut to Characteristics & Knowledge Catalog */}
              <button
                onClick={() => setActiveMainTab("characteristics")}
                className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-mono transition-all shadow-md group cursor-pointer ${
                  activeMainTab === "characteristics"
                    ? "bg-amber-400/20 text-amber-200 border-amber-400/40 shadow-amber-400/10"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                }`}
                title="Abrir Catálogo de Características & Licenças de Conhecimento"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Características</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold border bg-amber-400/10 text-amber-300 border-amber-400/25">
                  {character.characteristic_points ?? 2} Pts
                </span>
              </button>

              {/* Button to toggle slide-out Command Notepad Drawer */}
              <button
                onClick={() => setIsNotepadOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-200 transition-all shadow-md group"
                title="Abrir Diário de Comando (Rich Text multi-aba)"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Diário de Comando</span>
                {character.notes && character.notes.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300 font-bold">
                    {character.notes.length}
                  </span>
                )}
              </button>

              {/* Button to toggle slide-out Tactical Map Drawer */}
              <button
                onClick={() => setIsMapDrawerOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-200 transition-all shadow-md"
              >
                <Orbit className="w-3.5 h-3.5 text-sky-400" />
                <span>{isMapDrawerOpen ? "Fechar Mapa" : "Consultar Mapa"}</span>
              </button>
            </div>
          </div>

          {/* Leadership Tags (3 Trunfos + 1 Fardo) */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-1">
              Perfil:
            </span>

            {/* 3 Trunfos Chips */}
            {character.strengths?.map((str, idx) => (
              <div
                key={`strength-${idx}`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold border transition-all"
                style={{
                  backgroundColor: faction.bgGlow,
                  borderColor: `${faction.color}50`,
                  color: faction.color,
                }}
              >
                <Zap className="w-3 h-3" />
                <span>{str}</span>
              </div>
            ))}

            {/* 1 Fardo Chip (Alert Styling) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-rose-950/40 border border-rose-500/40 text-rose-300 shadow-sm">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Fardo: {character.weakness}</span>
            </div>
          </div>
        </section>

        {/* ===================================================================
            TAB CONTENT: CARACTERÍSTICAS (METAGAMING PERKS) vs VISÃO GERAL (FICHA)
           =================================================================== */}
        {activeMainTab === "characteristics" ? (
          <div className="animate-in fade-in duration-200">
            <KnowledgeCatalog
              character={character}
              onUpdateCharacter={onUpdateCharacter}
            />
          </div>
        ) : (
          <>
        {/* ===================================================================
            COMPONENT 2: OS 4 PILARES DO IMPÉRIO (STATE INDICATORS - READ ONLY)
            Estritamente controlados pelo Mestre no banco / Firestore onSnapshot
           =================================================================== */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-bold">
                Os 4 Pilares do Império
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Sensores Estelares • Controle do Mestre (Read-Only)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1: Satisfação Civil */}
            <div className="bg-[#0E1118]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Satisfação
                  </h3>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{
                    color: SATISFACTION_LEVELS[character.satisfaction ?? 2]?.color,
                  }}
                >
                  {SATISFACTION_LEVELS[character.satisfaction ?? 2]?.label}
                </span>
              </div>

              {/* 5-Part Segmented Bar (Read-Only) */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 cursor-default select-none">
                {SATISFACTION_LEVELS.map((s) => {
                  const isActive = (character.satisfaction ?? 2) === s.level;
                  return (
                    <div
                      key={s.level}
                      className={`py-1.5 px-0.5 text-[10px] font-mono rounded-lg transition-all text-center ${
                        isActive
                          ? `${s.bg} ${s.border} border font-bold shadow-md`
                          : "text-slate-600 opacity-40"
                      }`}
                      style={{ color: isActive ? s.color : undefined }}
                    >
                      {s.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pilar 2: Economia */}
            <div className="bg-[#0E1118]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Economia
                  </h3>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{
                    color: ECONOMY_LEVELS[character.economy ?? 2]?.color,
                  }}
                >
                  {ECONOMY_LEVELS[character.economy ?? 2]?.label}
                </span>
              </div>

              {/* 5-Part Segmented Bar (Read-Only) */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 cursor-default select-none">
                {ECONOMY_LEVELS.map((e) => {
                  const isActive = (character.economy ?? 2) === e.level;
                  return (
                    <div
                      key={e.level}
                      className={`py-1.5 px-0.5 text-[10px] font-mono rounded-lg transition-all text-center ${
                        isActive
                          ? `${e.bg} ${e.border} border font-bold shadow-md`
                          : "text-slate-600 opacity-40"
                      }`}
                      style={{ color: isActive ? e.color : undefined }}
                    >
                      {e.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pilar 3: Força Militar */}
            <div className="bg-[#0E1118]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-sky-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Poderio Militar
                  </h3>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{
                    color: MILITARY_LEVELS[character.military ?? 2]?.color,
                  }}
                >
                  {MILITARY_LEVELS[character.military ?? 2]?.label}
                </span>
              </div>

              {/* 5-Part Segmented Bar (Read-Only) */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 cursor-default select-none">
                {MILITARY_LEVELS.map((m) => {
                  const isActive = (character.military ?? 2) === m.level;
                  return (
                    <div
                      key={m.level}
                      className={`py-1.5 px-0.5 text-[10px] font-mono rounded-lg transition-all text-center ${
                        isActive
                          ? `${m.bg} ${m.border} border font-bold shadow-md`
                          : "text-slate-600 opacity-40"
                      }`}
                      style={{ color: isActive ? m.color : undefined }}
                    >
                      {m.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pilar 4: Relação Política (Dinâmico por Facção) */}
            <div className="bg-[#0E1118]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5" style={{ color: faction.color }} />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
                    {pillar4Title}
                  </h3>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{
                    color: PILLAR_4_LEVELS[character.politicalRelation ?? 2]?.color,
                  }}
                >
                  {PILLAR_4_LEVELS[character.politicalRelation ?? 2]?.label}
                </span>
              </div>

              {/* 5-Part Segmented Bar (Read-Only) */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 cursor-default select-none">
                {PILLAR_4_LEVELS.map((p) => {
                  const isActive = (character.politicalRelation ?? 2) === p.level;
                  return (
                    <div
                      key={p.level}
                      className={`py-1.5 px-0.5 text-[10px] font-mono rounded-lg transition-all text-center truncate ${
                        isActive
                          ? `${p.bg} ${p.border} border font-bold shadow-md`
                          : "text-slate-600 opacity-40"
                      }`}
                      style={{ color: isActive ? p.color : undefined }}
                    >
                      {p.label.split(" ")[0]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            COMPONENT 3: CARTAS NA MANGA (CARACTERÍSTICAS DA FACÇÃO)
           =================================================================== */}
        <section className="bg-[#0E1118]/80 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: faction.bgGlow }}
              >
                <Sparkles className="w-4 h-4" style={{ color: faction.color }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Cartas na Manga • Doutrinas & Características da Facção
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Habilidades e regras exclusivas dos {faction.name} no setor {campaign.name}
                </p>
              </div>
            </div>
          </div>

          {/* Grid display for the 5 traits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {traits.map((trait) => {
              const isExpanded = expandedTraits[trait.id];
              return (
                <div
                  key={trait.id}
                  className="bg-black/30 border border-white/5 hover:border-white/15 rounded-2xl p-4 transition-all flex flex-col justify-between"
                  style={{
                    borderLeftColor: faction.color,
                    borderLeftWidth: "3px",
                  }}
                >
                  <div>
                    {/* Category Pill */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        {trait.category}
                      </span>
                    </div>

                    {/* Trait Title */}
                    <h4 className="text-sm font-bold text-slate-200 mb-1.5">
                      {trait.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {trait.summary}
                    </p>

                    {/* Accordion Expandable Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl animate-in fade-in duration-200">
                        <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block mb-1 font-bold">
                          Descrição da Regra & Mecânica:
                        </span>
                        {trait.ruleDescription}
                      </div>
                    )}
                  </div>

                  {/* Accordion Toggle Button */}
                  <button
                    onClick={() => toggleTrait(trait.id)}
                    className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-white transition-colors w-full"
                  >
                    <span>{isExpanded ? "Recolher Descrição" : "Expandir Regra Completa"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            COMPONENT 4: VAULT / ENGINE DE ECONOMIA E DEMOGRAFIA (3 SUBSEÇÕES VERTICAIS)
            E DIÁRIO DO TURNO
           =================================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* VAULT / RECURSOS DE EOS-OMEGA (7 COLS EM TELAS GRANDES) */}
          <section
            className="xl:col-span-7 bg-[#0E1118]/85 border rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-6 flex flex-col justify-between"
            style={{ borderColor: `${faction.color}35` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    backgroundColor: faction.bgGlow,
                    borderColor: `${faction.color}50`,
                    color: faction.color,
                  }}
                >
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-sans flex items-center gap-2">
                    <span>Economia, Demografia & Cargas</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-widest font-bold"
                      style={{
                        backgroundColor: faction.bgGlow,
                        color: faction.color,
                        borderColor: `${faction.color}40`,
                      }}
                    >
                      Eos-Omega
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Subseções verticais de gestão financeira, demográfica e armazém de recursos
                  </p>
                </div>
              </div>
            </div>

            {/* =============================================================
                1. SUBSEÇÃO: O COFRE (FINANÇAS)
                Elemento de destaque no topo.
                Campo Numérico: galactic_credits. UI deve mostrar o ícone de moeda/cifrão
                e permitir incrementos rápidos.
               ============================================================= */}
            <div className="bg-black/35 border border-amber-500/25 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                    1. O Cofre (Finanças)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80 font-bold">
                  Créditos Galácticos (GC)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400 font-mono font-bold text-lg">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                  <input
                    type="number"
                    value={credits}
                    onChange={handleCreditsChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-black/60 border border-amber-500/40 rounded-xl text-amber-300 font-mono font-black text-xl sm:text-2xl focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                </div>

                {/* Quick Modifier Buttons */}
                <div className="grid grid-cols-4 sm:flex gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModifyCredits(-1000)}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    -1k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyCredits(-100)}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    -100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyCredits(100)}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyCredits(1000)}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    +1k
                  </button>
                </div>
              </div>
            </div>

            {/* =============================================================
                2. SUBSEÇÃO: CENSO POPULACIONAL
                Card A: population_count (Input numérico inteiro com modificadores).
                (As forças armadas são agora geridas exclusivamente através dos 5 Tiers
                no Centro de Comando Militar e Total de Divisões Mobilizadas).
               ============================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-sky-300 font-bold">
                    2. Demografia e Censo Populacional
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Censo Operacional
                </span>
              </div>

              {/* Card: population_count */}
              <div className="bg-black/30 border border-sky-500/25 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {census.populationLabel || "População Total"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      population_count
                    </span>
                  </div>
                  <input
                    type="number"
                    value={population}
                    onChange={handlePopulationChange}
                    className="w-full px-3 py-2 bg-black/50 border border-sky-500/30 rounded-xl text-sky-300 font-mono font-bold text-lg focus:outline-none focus:border-sky-400 shadow-inner"
                  />
                </div>
                {/* Quick modifiers for Population */}
                <div className="grid grid-cols-4 gap-1 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleModifyPopulation(-1000)}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    -1k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyPopulation(-100)}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    -100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyPopulation(100)}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModifyPopulation(1000)}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    +1k
                  </button>
                </div>
              </div>

              {/* Divisões Operacionais detalhadas no Centro de Comando Militar */}
              <div className="w-full p-2.5 rounded-xl border border-white/10 bg-black/25 flex items-center justify-between text-xs font-mono text-slate-400 select-none">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  Divisões e Tiers Armados
                </span>
                <span className="text-[10px] text-slate-500">
                  Total de tropas gerenciado no Centro de Comando Militar ao lado →
                </span>
              </div>
            </div>

            {/* =============================================================
                3. SUBSEÇÃO: RECURSOS FÍSICOS (OS 9 MATERIAIS DE EOS-OMEGA)
                Medidores qualitativos de Estoque e Entrada (Segmented Sliders).
                Visão do Jogador: Estritamente Read-Only.
               ============================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-bold">
                    3. Recursos Físicos (Os 9 Materiais de Eos-Omega)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-black/40 text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Telemetria do Jogador (Read-Only)
                  </span>
                </div>
              </div>

              {/* Grid dos 9 Recursos com Réguas Segmentadas */}
              <ResourceMeterGrid
                resources={resources}
                readOnly={true}
                factionColor={faction.color}
              />
            </div>

            {/* Artefatos Precursores (Preservado e integrado como sub-card retrátil) */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsArtifactsExpanded((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Artefatos Precursores ({artifacts.length})</span>
                  {isArtifactsExpanded ? (
                    <ChevronUp className="w-3 h-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  )}
                </button>

                {isArtifactsExpanded && (
                  <button
                    type="button"
                    onClick={handleAddArtifact}
                    className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>

              {isArtifactsExpanded && (
                <div>
                  {artifacts.length === 0 ? (
                    <div className="p-3 bg-black/30 border border-white/5 rounded-xl text-center">
                      <p className="text-xs text-slate-500 font-mono">
                        Nenhum artefato registrado. Explore ruínas para encontrar relíquias dos Precursores.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {artifacts.map((art, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={art}
                            onChange={(e) => handleUpdateArtifact(idx, e.target.value)}
                            placeholder="Ex: Motor de Matéria Escura, Monólito..."
                            className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArtifact(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* COLUNA DIREITA: CENTRO DE COMANDO MILITAR & RELAÇÕES DIPLOMÁTICAS (5 COLS EM TELAS GRANDES) */}
          <div className="xl:col-span-5 space-y-6 flex flex-col">
            {/* CENTRO DE COMANDO MILITAR */}
            <section
              className="bg-[#0E1118]/85 border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between"
              style={{ borderColor: `${faction.color}35` }}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2.5 rounded-xl border"
                      style={{
                        backgroundColor: faction.bgGlow,
                        borderColor: `${faction.color}50`,
                        color: faction.color,
                      }}
                    >
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 font-sans flex items-center gap-2">
                        <span>Centro de Comando Militar</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-black/40 text-slate-400 font-normal">
                          Módulo 4
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Quantitativo de tropas e divisões mobilizadas no setor
                      </p>
                    </div>
                  </div>

                  {/* Read-Only Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-400">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline text-amber-300">Read-Only</span>
                    <span className="text-[10px] text-slate-500">• Mestre</span>
                  </div>
                </div>

                {/* Total Mobilization Banner */}
                {(() => {
                  const initialTroops =
                    FACTION_INITIAL_MILITARY_TIERS[character.factionId] ||
                    FACTION_INITIAL_MILITARY_TIERS.federation;
                  const lightInfantryCount =
                    character.lightInfantry ?? initialTroops.lightInfantry;
                  const heavyInfantryCount =
                    character.heavyInfantry ?? initialTroops.heavyInfantry;
                  const lightVehiclesCount =
                    character.lightVehicles ?? initialTroops.lightVehicles;
                  const heavyVehiclesCount =
                    character.heavyVehicles ?? initialTroops.heavyVehicles;
                  const eliteUnitsCount =
                    character.eliteUnits ?? initialTroops.eliteUnits;
                  const totalMobilized =
                    lightInfantryCount +
                    heavyInfantryCount +
                    lightVehiclesCount +
                    heavyVehiclesCount +
                    eliteUnitsCount;

                  return (
                    <>
                      <div className="mb-4 p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                          <Shield className="w-4 h-4 text-sky-400" />
                          <span>Total de Divisões Mobilizadas:</span>
                        </div>
                        <div className="text-sm font-mono font-bold text-white">
                          {totalMobilized}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            unidades
                          </span>
                        </div>
                      </div>

                      {/* 5 Tiers Militares Compact List */}
                      <div className="space-y-2.5">
                        {/* Tier 1: Infantaria Leve */}
                        <div className="p-3 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <svg width="16" height="16" viewBox="0 0 16 16">
                                <rect
                                  x="2"
                                  y="2"
                                  width="12"
                                  height="12"
                                  rx="2"
                                  fill={faction.color}
                                  stroke="#08090C"
                                  strokeWidth="1"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">
                                Infantaria Leve
                              </h4>
                              <p className="text-[10px] text-sky-300/90 font-mono">
                                {initialTroops.flavor.lightInfantry}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                Quadrado Pequeno • Fuzileiros e milícias civis
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-mono font-bold text-slate-100">
                              {lightInfantryCount}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500 uppercase">
                              Qtd Ficha
                            </span>
                          </div>
                        </div>

                        {/* Tier 2: Infantaria Pesada */}
                        <div className="p-3 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <svg width="18" height="18" viewBox="0 0 18 18">
                                <rect
                                  x="2"
                                  y="2"
                                  width="14"
                                  height="14"
                                  rx="2.5"
                                  fill={faction.color}
                                  stroke="#08090C"
                                  strokeWidth="1"
                                />
                                <rect
                                  x="6"
                                  y="6"
                                  width="8"
                                  height="8"
                                  rx="1"
                                  fill="none"
                                  stroke="#08090C"
                                  strokeWidth="0.8"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">
                                Infantaria Pesada
                              </h4>
                              <p className="text-[10px] text-indigo-300/90 font-mono">
                                {initialTroops.flavor.heavyInfantry}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                Quadrado Médio • Exo-esqueletos e blindados
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-mono font-bold text-slate-100">
                              {heavyInfantryCount}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500 uppercase">
                              Qtd Ficha
                            </span>
                          </div>
                        </div>

                        {/* Tier 3: Veículos Leves */}
                        <div className="p-3 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <svg width="18" height="18" viewBox="0 0 18 18">
                                <polygon
                                  points="9,2 16,15 2,15"
                                  fill={faction.color}
                                  stroke="#08090C"
                                  strokeWidth="1"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <span>Veículos Leves</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950/50 text-sky-300 border border-sky-500/30">
                                  Transporte
                                </span>
                              </h4>
                              <p className="text-[10px] text-amber-300/90 font-mono">
                                {initialTroops.flavor.lightVehicles}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                Triângulo Pequeno • Reconhecimento rápido e caças
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-mono font-bold text-slate-100">
                              {lightVehiclesCount}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500 uppercase">
                              Qtd Ficha
                            </span>
                          </div>
                        </div>

                        {/* Tier 4: Veículos Pesados */}
                        <div className="p-3 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <svg width="20" height="20" viewBox="0 0 20 20">
                                <polygon
                                  points="10,2 18,17 2,17"
                                  fill={faction.color}
                                  stroke="#08090C"
                                  strokeWidth="1.2"
                                />
                                <polyline
                                  points="6,13 10,8 14,13"
                                  fill="none"
                                  stroke="#08090C"
                                  strokeWidth="1"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <span>Veículos Pesados</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950/50 text-sky-300 border border-sky-500/30">
                                  Transporte
                                </span>
                              </h4>
                              <p className="text-[10px] text-rose-300/90 font-mono">
                                {initialTroops.flavor.heavyVehicles}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                Triângulo Médio • Blindados de assalto e tanques
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-mono font-bold text-slate-100">
                              {heavyVehiclesCount}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500 uppercase">
                              Qtd Ficha
                            </span>
                          </div>
                        </div>

                        {/* Tier 5: Unidades de Elite */}
                        <div className="p-3 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black/50 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <Crown className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <span>Unidades de Elite</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30">
                                  Comando
                                </span>
                              </h4>
                              <p className="text-[10px] text-amber-200/90 font-mono">
                                {initialTroops.flavor.eliteUnits}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                Formas Grandes • Oficiais, Campeões ou Naves Capitais
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-mono font-bold text-amber-300">
                              {eliteUnitsCount}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-500 uppercase">
                              Qtd Ficha
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Tactical Footer Note */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Telemetria Militar sincronizada via Firestore
                </span>
                <span>Edição exclusiva do Mestre</span>
              </div>
            </section>

            {/* =============================================================
                NOVO CARD COMPACTO: RELAÇÕES DIPLOMÁTICAS (MÓDULO 4 - READ ONLY)
               ============================================================= */}
            <section
              className="bg-[#0E1118]/85 border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between"
              style={{ borderColor: `${faction.color}35` }}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2.5 rounded-xl border"
                      style={{
                        backgroundColor: faction.bgGlow,
                        borderColor: `${faction.color}50`,
                        color: faction.color,
                      }}
                    >
                      <Handshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 font-sans flex items-center gap-2">
                        <span>Relações Diplomáticas</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-black/40 text-slate-400 font-normal">
                          Módulo 4
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Pactos, alianças e hostilidades com os demais impérios
                      </p>
                    </div>
                  </div>

                  {/* Read-Only Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-400">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline text-amber-300">Read-Only</span>
                    <span className="text-[10px] text-slate-500">• Mestre</span>
                  </div>
                </div>

                {/* Lista simples das outras 6 facções */}
                <ul className="space-y-2">
                  {getOtherPlayableFactions(character.factionId).map((other) => {
                    const status = getDiplomaticStatus(
                      campaign.diplomatic_relations,
                      character.factionId,
                      other.id
                    );
                    const config = DIPLOMATIC_STATUS_CONFIG[status];

                    return (
                      <li
                        key={other.id}
                        className="p-2.5 bg-black/30 hover:bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-colors"
                      >
                        {/* [Ícone/Cor da Facção Oponente] Nome da Facção */}
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white/10"
                            style={{ backgroundColor: other.color }}
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-200 block truncate">
                              {other.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block truncate">
                              {other.shortName}
                            </span>
                          </div>
                        </div>

                        {/* [Badge de Status] */}
                        <span
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-xl flex-shrink-0 transition-all ${config.badgeClass}`}
                        >
                          {status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Realtime note */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Diplomacia compartilhada em tempo real
                </span>
                <span>Controle do Mestre</span>
              </div>
            </section>
          </div>
        </div>
          </>
        )}
      </div>

      {/* ===================================================================
          INTEGRAÇÃO DO MÓDULO 3: PAINEL LATERAL / DRAWER DO MAPA ESTELAR
         =================================================================== */}
      {isMapDrawerOpen && (
        <div className="fixed inset-y-14 right-0 z-40 w-full md:w-3/5 lg:w-1/2 bg-[#08090C]/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="h-12 bg-[#0C0F17] border-b border-white/10 px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Visor Tático Estelar • Modo Consulta
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            <button
              onClick={() => setIsMapDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive StarMap Canvas */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            <StarMapCanvas
              campaignId={campaign.id}
              mapState={mapState}
              onUpdateMapState={async (newState) => {
                await saveMapState(campaign.id, newState);
              }}
              onUpdateTroops={async (newTroops) => {
                await saveMapTroops(campaign.id, newTroops);
              }}
              isGM={false}
              currentUser={{ id: character.userId, username: character.username }}
              character={character}
              campaignFactions={campaign.allowedFactions}
            />
          </div>
        </div>
      )}

      {/* ===================================================================
          GATILHO FIXO LATERAL (RIGHT-0 DOCKED HANDLE) DO DIÁRIO DE COMANDO
         =================================================================== */}
      <button
        onClick={() => setIsNotepadOpen((prev) => !prev)}
        title="Abrir Diário de Comando (Rich Text multi-aba)"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center py-3.5 px-2 bg-[#0E121A]/95 hover:bg-[#151B28] text-slate-300 hover:text-white border-y border-l border-white/15 rounded-l-2xl shadow-2xl backdrop-blur-md transition-all group cursor-pointer hover:border-sky-400/40"
        style={{
          boxShadow: `0 0 25px ${faction.color}25`,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-mono font-bold tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase text-slate-300 group-hover:text-white">
            Diário
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full mt-0.5 animate-pulse"
            style={{ backgroundColor: faction.color }}
          />
        </div>
      </button>

      {/* ===================================================================
          MÓDULO 4: SLIDE-OVER COMMAND NOTEPAD DRAWER (RICH TEXT MULTI-ABA)
         =================================================================== */}
      <CommandNotepadDrawer
        isOpen={isNotepadOpen}
        onClose={() => setIsNotepadOpen(false)}
        notes={character.notes || []}
        onSaveNotes={async (updatedNotes) => {
          await onUpdateCharacter({
            ...character,
            notes: updatedNotes,
          });
        }}
        factionColor={faction.color}
        factionBgGlow={faction.bgGlow}
        factionName={faction.name}
        leaderTitle={character.leaderTitle}
      />
    </div>
  );
};
