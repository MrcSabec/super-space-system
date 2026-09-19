"use client";

import React, { useState, useEffect } from "react";
import { FactionId, PlayerCharacter } from "@/types/sss";
import { PLAYABLE_FACTIONS_LIST, getFaction } from "@/lib/factions";
import {
  getAutoLeaderTitle,
  FACTION_LOCAL_LORE,
  getAvailableStrengths,
  getAvailableWeaknesses,
  getFactionInitialPillars,
  SATISFACTION_LEVELS,
  ECONOMY_LEVELS,
  MILITARY_LEVELS,
  PILLAR_4_LEVELS,
  PILLAR_4_TITLES,
} from "@/lib/factionLore";
import {
  FACTION_INITIAL_CENSUS,
  FACTION_INITIAL_MILITARY_TIERS,
  createInitialResources,
  EOS_OMEGA_RESOURCES,
} from "@/lib/resources";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  User,
  Crown,
  Zap,
  Info,
  X,
  Plus,
  Lock,
  Activity,
  Building2,
  Coins,
  Shield,
  Package,
} from "lucide-react";

interface CharacterWizardProps {
  campaignId: string;
  campaignName?: string;
  userId: string;
  username: string;
  allowedFactions?: FactionId[];
  onComplete: (character: PlayerCharacter) => Promise<void>;
}

export const CharacterWizard: React.FC<CharacterWizardProps> = ({
  campaignId,
  campaignName = "Eos-Omega",
  userId,
  username,
  allowedFactions = [],
  onComplete,
}) => {
  // Step navigation (1: Identidade Básica, 2: Perfil de Liderança)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Identidade Básica
  const [characterName, setCharacterName] = useState("");
  const [factionId, setFactionId] = useState<FactionId>("federation");
  const [leaderTitle, setLeaderTitle] = useState("");

  // Info Modal state ([ i ])
  const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);

  // Step 2: Perfil de Liderança (Trunfos e Fardos)
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedWeakness, setSelectedWeakness] = useState<string>("");

  // Custom tags creation state
  const [customStrengthInput, setCustomStrengthInput] = useState("");
  const [showCustomStrengthInput, setShowCustomStrengthInput] = useState(false);
  const [customStrengthsList, setCustomStrengthsList] = useState<string[]>([]);

  const [customWeaknessInput, setCustomWeaknessInput] = useState("");
  const [showCustomWeaknessInput, setShowCustomWeaknessInput] = useState(false);
  const [customWeaknessesList, setCustomWeaknessesList] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentFaction = getFaction(factionId);
  const currentLore = FACTION_LOCAL_LORE[factionId] || FACTION_LOCAL_LORE.federation;
  const initialPillars = getFactionInitialPillars(factionId);
  const currentCensus = FACTION_INITIAL_CENSUS[factionId] || FACTION_INITIAL_CENSUS.federation;
  const pillar4Title = PILLAR_4_TITLES[factionId] || "A Federação";

  // Auto-fill leader title whenever faction or campaignName changes
  useEffect(() => {
    const autoTitle = getAutoLeaderTitle(factionId, campaignName);
    setLeaderTitle(autoTitle);
  }, [factionId, campaignName]);

  // Filter available factions if campaign restricts them, otherwise show all 7
  const availableFactions =
    allowedFactions.length > 0
      ? PLAYABLE_FACTIONS_LIST.filter((f) => allowedFactions.includes(f.id))
      : PLAYABLE_FACTIONS_LIST;

  // Lists of available presets based on chosen faction
  const availableStrengths = [
    ...getAvailableStrengths(factionId),
    ...customStrengthsList,
  ];

  const availableWeaknesses = [
    ...getAvailableWeaknesses(factionId),
    ...customWeaknessesList,
  ];

  // Strength tag click handler (toggle up to 3)
  const toggleStrength = (tag: string) => {
    if (selectedStrengths.includes(tag)) {
      setSelectedStrengths((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedStrengths.length >= 3) {
        setError("Você já selecionou o limite máximo de 3 Trunfos.");
        return;
      }
      setError("");
      setSelectedStrengths((prev) => [...prev, tag]);
    }
  };

  // Weakness tag click handler (select 1)
  const selectWeakness = (tag: string) => {
    setError("");
    setSelectedWeakness(tag);
  };

  // Add custom strength
  const handleAddCustomStrength = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customStrengthInput.trim();
    if (!clean) return;
    if (!customStrengthsList.includes(clean)) {
      setCustomStrengthsList((prev) => [...prev, clean]);
    }
    if (selectedStrengths.length < 3) {
      setSelectedStrengths((prev) => [...prev, clean]);
    }
    setCustomStrengthInput("");
    setShowCustomStrengthInput(false);
  };

  // Add custom weakness
  const handleAddCustomWeakness = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customWeaknessInput.trim();
    if (!clean) return;
    if (!customWeaknessesList.includes(clean)) {
      setCustomWeaknessesList((prev) => [...prev, clean]);
    }
    setSelectedWeakness(clean);
    setCustomWeaknessInput("");
    setShowCustomWeaknessInput(false);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) {
      setError("Informe o nome do seu Governante.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStrengths.length !== 3) {
      setError("Você deve selecionar exatamente 3 Trunfos para o seu líder.");
      return;
    }
    if (!selectedWeakness) {
      setError("Você deve escolher 1 Fardo crítico para o seu líder.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const now = Date.now();
      const census = FACTION_INITIAL_CENSUS[factionId] || FACTION_INITIAL_CENSUS.federation;
      const initialResources = createInitialResources(factionId);

      const newCharacter: PlayerCharacter = {
        id: `char_${username.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}`,
        campaignId,
        userId,
        username,
        characterName: characterName.trim(),
        leaderTitle,
        factionId,
        strengths: [selectedStrengths[0], selectedStrengths[1], selectedStrengths[2]],
        weakness: selectedWeakness,
        satisfaction: initialPillars.satisfaction,
        economy: initialPillars.economy,
        military: initialPillars.military,
        politicalRelation: initialPillars.politicalRelation,
        populationCount: census.population,
        militaryCount: census.military,
        galacticCredits: census.credits,
        resources: initialResources,
        precursorArtifacts: [],
        lightInfantry: (FACTION_INITIAL_MILITARY_TIERS[factionId] || FACTION_INITIAL_MILITARY_TIERS.federation).lightInfantry,
        heavyInfantry: (FACTION_INITIAL_MILITARY_TIERS[factionId] || FACTION_INITIAL_MILITARY_TIERS.federation).heavyInfantry,
        lightVehicles: (FACTION_INITIAL_MILITARY_TIERS[factionId] || FACTION_INITIAL_MILITARY_TIERS.federation).lightVehicles,
        heavyVehicles: (FACTION_INITIAL_MILITARY_TIERS[factionId] || FACTION_INITIAL_MILITARY_TIERS.federation).heavyVehicles,
        eliteUnits: (FACTION_INITIAL_MILITARY_TIERS[factionId] || FACTION_INITIAL_MILITARY_TIERS.federation).eliteUnits,
        notes: [
          {
            id: `note_${Date.now()}`,
            title: "Diário do Turno",
            content: "<p>Registro confidencial de comando e planos táticos...</p>",
            createdAt: now,
            updatedAt: now,
          },
        ],
        characteristic_points: 2,
        unlocked_characteristics: [],
        turnLog: "",
        createdAt: now,
        updatedAt: now,
      };

      await onComplete(newCharacter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar a liderança.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-[#08090C] text-[#E0E6ED] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 md:p-8 relative transition-colors duration-700">
      {/* Dynamic atmospheric aura reflecting faction color */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 opacity-60"
        style={{ backgroundColor: currentFaction.bgGlow }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 opacity-60"
        style={{ backgroundColor: currentFaction.bgGlow }}
      />

      <div
        className="relative z-10 max-w-2xl w-full bg-[#0E1118]/95 border rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl transition-all duration-500 my-auto flex flex-col"
        style={{ borderColor: `${currentFaction.color}40` }}
      >
        {/* Dynamic Faction Accent Strip */}
        <div
          className="h-1.5 w-full transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-t-2xl sm:rounded-t-3xl"
          style={{ backgroundColor: currentFaction.color }}
        />

        <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border transition-colors"
                  style={{
                    color: currentFaction.color,
                    backgroundColor: currentFaction.bgGlow,
                    borderColor: `${currentFaction.color}50`,
                  }}
                >
                  {currentFaction.name}
                </span>

                {/* Info Button [ i ] for Contexto Histórico Local */}
                <button
                  type="button"
                  onClick={() => setIsLoreModalOpen(true)}
                  title="Consultar Contexto Histórico Local"
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all hover:scale-110 flex items-center justify-center"
                >
                  <Info className="w-3.5 h-3.5" style={{ color: currentFaction.color }} />
                </button>

                <span className="text-xs font-mono text-slate-500 ml-1">
                  Passo {step} de 2
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight">
                {step === 1 ? "Registro de Liderança Galáctica" : "Perfil de Liderança (Trunfos & Fardos)"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5">
                {step === 1
                  ? "Identifique o governante e a facção que conduzirá o destino estelar."
                  : "Selecione 3 Trunfos e 1 Fardo a partir dos blocos temáticos ou crie tags próprias."}
              </p>
            </div>

            {/* Faction Emblem Geometric Circle */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 flex-shrink-0 ml-3"
              style={{
                backgroundColor: currentFaction.bgGlow,
                borderColor: `${currentFaction.color}60`,
              }}
            >
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500" style={{ color: currentFaction.color }} />
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: IDENTIDADE BÁSICA & AUTO-FILL DE TÍTULO */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
              {/* Character Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Nome do Governante
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Ex: Almirante Valerius, Arquiteto 7-Omega, Rainha Zira..."
                    className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none text-sm transition-colors"
                    style={{
                      borderColor: characterName ? `${currentFaction.color}60` : undefined,
                    }}
                    required
                  />
                </div>
              </div>

              {/* Faction Selection with Info [ i ] trigger */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Facção Galáctica
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLoreModalOpen(true)}
                    className="text-[11px] font-mono flex items-center gap-1 hover:underline"
                    style={{ color: currentFaction.color }}
                  >
                    <Info className="w-3 h-3" />
                    <span>Ver Contexto Histórico da Facção</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 sm:max-h-52 overflow-y-auto pr-1">
                  {availableFactions.map((f) => {
                    const isSelected = factionId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFactionId(f.id)}
                        className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-white/10 shadow-lg scale-[1.01]"
                            : "bg-black/20 hover:bg-white/5 border-white/5 opacity-70 hover:opacity-100"
                        }`}
                        style={{
                          borderColor: isSelected ? f.color : undefined,
                        }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform"
                          style={{
                            backgroundColor: f.color,
                            boxShadow: isSelected ? `0 0 8px ${f.color}` : undefined,
                          }}
                        />
                        <div className="truncate flex-1">
                          <p className="text-xs font-bold text-slate-200 truncate">{f.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{f.archetype}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: f.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Leader Title (Bloqueado / Read-Only Auto-Preenchido) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Título de Liderança Oficial</span>
                    <Lock className="w-3 h-3 text-slate-500" />
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Definido automaticamente pela hierarquia
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Crown className="w-4 h-4" style={{ color: currentFaction.color }} />
                  </div>
                  <input
                    type="text"
                    value={leaderTitle}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-black/60 border border-white/10 rounded-xl text-slate-300 text-xs sm:text-sm font-mono cursor-not-allowed select-none opacity-90 shadow-inner"
                    style={{
                      borderColor: `${currentFaction.color}40`,
                    }}
                  />
                </div>
              </div>

              {/* Estado Inicial dos Pilares do Império (Conforme Lore Canônica) */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" style={{ color: currentFaction.color }} />
                    <span>Pilares Iniciais do Império</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Ponto de Partida Canônico</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  {/* Satisfação */}
                  <div className="p-1.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Satisfação</span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: SATISFACTION_LEVELS[initialPillars.satisfaction]?.color }}
                    >
                      {SATISFACTION_LEVELS[initialPillars.satisfaction]?.label}
                    </span>
                  </div>

                  {/* Economia */}
                  <div className="p-1.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Economia</span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: ECONOMY_LEVELS[initialPillars.economy]?.color }}
                    >
                      {ECONOMY_LEVELS[initialPillars.economy]?.label}
                    </span>
                  </div>

                  {/* Militar */}
                  <div className="p-1.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Militar</span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: MILITARY_LEVELS[initialPillars.military]?.color }}
                    >
                      {MILITARY_LEVELS[initialPillars.military]?.label}
                    </span>
                  </div>

                  {/* Relação Política */}
                  <div className="p-1.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block truncate">{pillar4Title}</span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: PILLAR_4_LEVELS[initialPillars.politicalRelation]?.color }}
                    >
                      {PILLAR_4_LEVELS[initialPillars.politicalRelation]?.label}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans italic leading-relaxed pt-1.5 border-t border-white/5">
                  &ldquo;{initialPillars.narrativeReason}&rdquo;
                </p>
              </div>

              {/* Censo Inicial (Turno 0 - Pouso das Naves Coloniais) */}
              <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Censo Inicial • Turno 0</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentCensus.specialNotes || "Cargas e demografia de desembarque"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {/* Créditos */}
                  <div className="p-2 rounded-xl bg-black/50 border border-amber-500/20">
                    <span className="text-[9px] text-slate-500 block uppercase">Créditos (GC)</span>
                    <span className="text-xs font-bold text-amber-300">
                      {currentCensus.credits.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* População */}
                  <div className="p-2 rounded-xl bg-black/50 border border-sky-500/20">
                    <span className="text-[9px] text-slate-500 block uppercase">
                      {currentCensus.populationLabel || "População"}
                    </span>
                    <span className="text-xs font-bold text-sky-300">
                      {currentCensus.population.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* Militares */}
                  <div className="p-2 rounded-xl bg-black/50 border border-rose-500/20">
                    <span className="text-[9px] text-slate-500 block uppercase">
                      {currentCensus.militaryLabel || "Militares"}
                    </span>
                    <span className="text-xs font-bold text-rose-300">
                      {currentCensus.military.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Recursos Físicos Iniciais */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                        9 Recursos de Eos-Omega:
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                      Estoque: Suficiente • Entrada: Nenhum
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Os materiais físicos do império iniciam calibrados com estoque suficiente e fluxo estável, monitorados por réguas qualitativas no seu painel.
                  </p>
                </div>
              </div>

              {/* Sticky Action Footer: ALWAYS visible & accessible regardless of screen resolution */}
              <div className="mt-4 pt-3.5 sm:pt-4 flex items-center justify-end border-t border-white/10 sticky bottom-0 bg-[#0E1118]/95 backdrop-blur-md -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl z-20 shadow-[0_-8px_16px_rgba(0,0,0,0.4)]">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 font-mono text-xs font-bold text-slate-900 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: currentFaction.color,
                    boxShadow: `0 0 20px ${currentFaction.color}40`,
                  }}
                >
                  <span>Avançar para Trunfos e Fardos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PERFIL DE LIDERANÇA (TAGS EM TIJOLOS / BLOCOS) */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
              {/* TRUNFOS (Escolher 3) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: currentFaction.color }} />
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                      Trunfos de Liderança (Escolha 3)
                    </label>
                  </div>
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      color: selectedStrengths.length === 3 ? "#34D399" : currentFaction.color,
                      backgroundColor: currentFaction.bgGlow,
                      borderColor: `${currentFaction.color}40`,
                    }}
                  >
                    {selectedStrengths.length}/3 Selecionados
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans">
                  Clique sobre os blocos para equipar ou use o botão <strong>[ + Criar ]</strong> para adicionar sua própria habilidade.
                </p>

                {/* Clickable Blocks (Tags) */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {availableStrengths.map((tag) => {
                    const isSelected = selectedStrengths.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleStrength(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border select-none ${
                          isSelected
                            ? "shadow-md scale-105 font-bold"
                            : "bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentFaction.bgGlow : undefined,
                          borderColor: isSelected ? currentFaction.color : undefined,
                          color: isSelected ? currentFaction.color : undefined,
                        }}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}

                  {/* Button [ + Criar ] */}
                  {!showCustomStrengthInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomStrengthInput(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Criar Trunfo</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={customStrengthInput}
                        onChange={(e) => setCustomStrengthInput(e.target.value)}
                        placeholder="Nome do Trunfo..."
                        className="px-3 py-1.5 bg-black/60 border border-sky-500/50 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none w-44"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomStrength}
                        className="px-2.5 py-1.5 bg-sky-500 text-slate-900 rounded-xl text-xs font-mono font-bold"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomStrengthInput(false)}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FARDOS (Escolher 1) */}
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <label className="text-xs font-mono uppercase tracking-wider text-rose-300 font-bold">
                      Fardo de Liderança (Escolha 1 Fraqueza)
                    </label>
                  </div>
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-rose-500/40 bg-rose-950/30 text-rose-300"
                  >
                    {selectedWeakness ? "1/1 Selecionado" : "0/1 Selecionado"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans">
                  A falha crítica ou vulnerabilidade pessoal que inimigos e conselheiros podem explorar.
                </p>

                {/* Clickable Blocks (Tags de Fardo) */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {availableWeaknesses.map((tag) => {
                    const isSelected = selectedWeakness === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => selectWeakness(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border select-none ${
                          isSelected
                            ? "bg-rose-950/60 border-rose-400 text-rose-200 shadow-md scale-105 font-bold ring-1 ring-rose-400/30"
                            : "bg-rose-950/15 border-rose-500/20 text-rose-300/70 hover:text-rose-200 hover:border-rose-500/40"
                        }`}
                      >
                        {isSelected && <AlertTriangle className="w-3 h-3 flex-shrink-0 text-rose-400" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}

                  {/* Button [ + Criar Fardo ] */}
                  {!showCustomWeaknessInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomWeaknessInput(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono border border-dashed border-rose-500/30 text-rose-400/80 hover:text-rose-300 hover:border-rose-500/50 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Criar Fardo</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={customWeaknessInput}
                        onChange={(e) => setCustomWeaknessInput(e.target.value)}
                        placeholder="Nome do Fardo..."
                        className="px-3 py-1.5 bg-black/60 border border-rose-500/50 rounded-xl text-xs font-mono text-rose-200 placeholder-rose-800/80 focus:outline-none w-44"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomWeakness}
                        className="px-2.5 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-mono font-bold"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomWeaknessInput(false)}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Action Footer: ALWAYS visible & accessible */}
              <div className="mt-4 pt-3.5 sm:pt-4 flex items-center justify-between border-t border-white/10 sticky bottom-0 bg-[#0E1118]/95 backdrop-blur-md -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl z-20 shadow-[0_-8px_16px_rgba(0,0,0,0.4)]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 font-mono text-xs font-bold text-slate-900 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: currentFaction.color,
                    boxShadow: `0 0 20px ${currentFaction.color}40`,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? "Gravando..." : "Concluir Ficha & Assumir Comando"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ===================================================================
          MODAL DE INFO [ i ]: CONTEXTO HISTÓRICO LOCAL DA FACÇÃO
          (Oculta mecânicas das características, revelando apenas a lore)
         =================================================================== */}
      {isLoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-[#0E1118] border rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ borderColor: `${currentFaction.color}50` }}
          >
            {/* Top color bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: currentFaction.color }}
            />

            <div className="flex items-start justify-between pb-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: currentFaction.bgGlow,
                    borderColor: `${currentFaction.color}60`,
                  }}
                >
                  <Info className="w-5 h-5" style={{ color: currentFaction.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {currentLore.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {currentLore.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLoreModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed max-h-80 overflow-y-auto pr-1">
              {/* Authentic Faction Quote */}
              <blockquote
                className="p-3 rounded-xl border-l-2 font-mono text-xs italic text-slate-200"
                style={{
                  backgroundColor: currentFaction.bgGlow,
                  borderColor: currentFaction.color,
                }}
              >
                &ldquo;{currentLore.quote}&rdquo;
              </blockquote>

              {/* Leader Role Description */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider block"
                  style={{ color: currentFaction.color }}
                >
                  Papel & Desafio Político do Governante
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {currentLore.roleDesc}
                </p>
              </div>

              {/* Historical Context */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Contexto Histórico Local
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed text-justify">
                  {currentLore.context}
                </p>
              </div>

              {/* Condições Iniciais do Império & Motivo Narrativo */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider block"
                  style={{ color: currentFaction.color }}
                >
                  Condições Iniciais de Partida & Motivo Narrativo
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  <div className="p-1 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Satisfação</span>
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: SATISFACTION_LEVELS[initialPillars.satisfaction]?.color }}
                    >
                      {SATISFACTION_LEVELS[initialPillars.satisfaction]?.label}
                    </span>
                  </div>
                  <div className="p-1 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Economia</span>
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: ECONOMY_LEVELS[initialPillars.economy]?.color }}
                    >
                      {ECONOMY_LEVELS[initialPillars.economy]?.label}
                    </span>
                  </div>
                  <div className="p-1 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block">Militar</span>
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: MILITARY_LEVELS[initialPillars.military]?.color }}
                    >
                      {MILITARY_LEVELS[initialPillars.military]?.label}
                    </span>
                  </div>
                  <div className="p-1 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 block truncate">{pillar4Title}</span>
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: PILLAR_4_LEVELS[initialPillars.politicalRelation]?.color }}
                    >
                      {PILLAR_4_LEVELS[initialPillars.politicalRelation]?.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-sans italic leading-relaxed">
                  &ldquo;{initialPillars.narrativeReason}&rdquo;
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Arquivos de Inteligência do Setor {campaignName}
              </span>
              <button
                type="button"
                onClick={() => setIsLoreModalOpen(false)}
                className="px-4 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl transition-all"
                style={{ backgroundColor: currentFaction.color }}
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
