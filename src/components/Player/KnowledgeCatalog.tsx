"use client";

import React, { useState, useMemo } from "react";
import {
  PlayerCharacter,
  FactionId,
} from "@/types/sss";
import { getFaction } from "@/lib/factions";
import {
  EOS_CHARACTERISTICS_CATEGORIES,
  CharacteristicItem,
  TOTAL_CHARACTERISTICS_COUNT,
  ROMAN_LEVELS,
  getCharacteristicLevel,
  setCharacteristicLevelInList,
  countUnlockedCharacteristics,
  countTotalPurchasedRanks,
} from "@/lib/eosCharacteristics";
import {
  Swords,
  Coins,
  Cpu,
  Eye,
  Handshake,
  Building2,
  Compass,
  Brain,
  Radio,
  Check,
  Lock,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Award,
  Zap,
} from "lucide-react";

interface KnowledgeCatalogProps {
  character: PlayerCharacter;
  onUpdateCharacter: (updated: PlayerCharacter) => Promise<void>;
}

export const KnowledgeCatalog: React.FC<KnowledgeCatalogProps> = ({
  character,
  onUpdateCharacter,
}) => {
  const faction = getFaction(character.factionId);
  const points = character.characteristic_points ?? 2;
  const unlocked = character.unlocked_characteristics || [];

  // Summary counts
  const activeCharacteristicsCount = useMemo(
    () => countUnlockedCharacteristics(unlocked),
    [unlocked]
  );
  const totalPurchasedRanks = useMemo(
    () => countTotalPurchasedRanks(unlocked),
    [unlocked]
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Category accordion collapse state (all open by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Active selected characteristic (default to first item of first category)
  const [selectedItemId, setSelectedItemId] = useState<string>(
    EOS_CHARACTERISTICS_CATEGORIES[0].items[0].id
  );

  // Purchasing state to prevent double clicks
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessToast, setPurchaseSuccessToast] = useState<string | null>(null);

  // Toggle category collapse
  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Find active selected item
  const selectedItem = useMemo<CharacteristicItem>(() => {
    for (const cat of EOS_CHARACTERISTICS_CATEGORIES) {
      const found = cat.items.find((i) => i.id === selectedItemId);
      if (found) return found;
    }
    return EOS_CHARACTERISTICS_CATEGORIES[0].items[0];
  }, [selectedItemId]);

  // Find category for active selected item
  const selectedCategory = useMemo(() => {
    return EOS_CHARACTERISTICS_CATEGORIES.find((cat) =>
      cat.items.some((i) => i.id === selectedItem.id)
    );
  }, [selectedItem]);

  // Level & unlock states for currently selected item
  const isLevelBased = selectedItem.type === "levels";
  const currentLevel = useMemo(
    () => (isLevelBased ? getCharacteristicLevel(unlocked, selectedItem.id) : 0),
    [isLevelBased, unlocked, selectedItem.id]
  );
  const isBenefitUnlocked = useMemo(
    () => (!isLevelBased && unlocked.includes(selectedItem.id)),
    [isLevelBased, unlocked, selectedItem.id]
  );
  const isMaxLevel = isLevelBased && currentLevel >= 5;

  // Handle Acquisition of a Characteristic or Level (strictly sequential and dependent)
  const handlePurchase = async (targetLevel?: number) => {
    if (points <= 0) return;
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);
      let nextUnlocked: string[];
      let successMessage = "";

      if (selectedItem.type === "levels") {
        const curLvl = getCharacteristicLevel(unlocked, selectedItem.id);
        const levelToBuy = targetLevel ?? curLvl + 1;

        // Strict dependent sequence check: to buy Level N, player MUST already have Level N - 1
        if (levelToBuy !== curLvl + 1) {
          console.warn(`Para adquirir o Nível ${levelToBuy}, é necessário possuir o Nível ${levelToBuy - 1}.`);
          return;
        }
        if (levelToBuy > 5) return;

        nextUnlocked = setCharacteristicLevelInList(unlocked, selectedItem.id, levelToBuy);
        successMessage = `"${selectedItem.name}" avançou para o Nível ${ROMAN_LEVELS[levelToBuy - 1]}!`;
      } else {
        if (unlocked.includes(selectedItem.id)) return;
        nextUnlocked = Array.from(new Set([...unlocked, selectedItem.id]));
        successMessage = `"${selectedItem.name}" adquirida com sucesso!`;
      }

      const nextPoints = Math.max(0, points - 1);
      const updatedChar: PlayerCharacter = {
        ...character,
        characteristic_points: nextPoints,
        unlocked_characteristics: nextUnlocked,
      };

      await onUpdateCharacter(updatedChar);

      setPurchaseSuccessToast(successMessage);
      setTimeout(() => setPurchaseSuccessToast(null), 4000);
    } catch (err) {
      console.error("Erro ao adquirir característica:", err);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Helper to render category icon
  const renderCategoryIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Swords":
        return <Swords className={className} />;
      case "Coins":
        return <Coins className={className} />;
      case "Cpu":
        return <Cpu className={className} />;
      case "Eye":
        return <Eye className={className} />;
      case "Handshake":
        return <Handshake className={className} />;
      case "Building2":
        return <Building2 className={className} />;
      case "Compass":
        return <Compass className={className} />;
      case "Brain":
        return <Brain className={className} />;
      case "Radio":
        return <Radio className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  // Filtered categories based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return EOS_CHARACTERISTICS_CATEGORIES;

    return EOS_CHARACTERISTICS_CATEGORIES.map((cat) => {
      const matchingItems = cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.benefits && item.benefits.some((b) => b.toLowerCase().includes(q))) ||
          (item.levels && item.levels.some((l) => l.desc.toLowerCase().includes(q)))
      );
      return {
        ...cat,
        items: matchingItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ===================================================================
          HEADER BANNER: PONTOS DE CARACTERÍSTICA & ESTATÍSTICAS
         =================================================================== */}
      <section
        className="relative bg-[#0E1118]/85 border rounded-3xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300"
        style={{ borderColor: `${faction.color}35` }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: faction.color }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Lore Intro */}
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
                Licenças & Metagaming Perks
              </span>
              <span className="text-xs font-mono text-slate-500">• Catálogo Geral Eos</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-2.5">
              <span>Características & Conhecimento</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-2xl leading-relaxed">
              Consulte a árvore completa de doutrinas, prerrogativas e conhecimentos interestelares.
              Adquira novas licenças permanentes utilizando seus Pontos de Característica concedidos pelo Mestre.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Points Badge (Destaque Principal) */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/50 border border-amber-500/40 shadow-lg shadow-amber-950/40">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block font-bold">
                  Pontos Disponíveis
                </span>
                <span className="text-2xl font-black font-mono text-amber-300">
                  {points}{" "}
                  <span className="text-xs font-medium text-amber-400/70">
                    ponto{points !== 1 ? "s" : ""}
                  </span>
                </span>
              </div>
            </div>

            {/* Unlocked Count Badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Licenças Ativas
                </span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {activeCharacteristicsCount}{" "}
                  <span className="text-xs text-slate-500 font-normal">
                    / {TOTAL_CHARACTERISTICS_COUNT}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400/80 block">
                  {totalPurchasedRanks} {totalPurchasedRanks === 1 ? "nível/vantagem" : "níveis/vantagens"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Fast Navigation */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar característica ou benefício..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 w-full sm:w-auto justify-end">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeCharacteristicsCount} Adquirida{activeCharacteristicsCount !== 1 ? "s" : ""}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              {TOTAL_CHARACTERISTICS_COUNT - activeCharacteristicsCount} Disponíveis
            </span>
          </div>
        </div>
      </section>

      {/* Success Notification Toast */}
      {purchaseSuccessToast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs font-mono text-emerald-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-bold">{purchaseSuccessToast}</span>
          </div>
          <button
            onClick={() => setPurchaseSuccessToast(null)}
            className="text-emerald-400/60 hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================
          SPLIT VIEW LAYOUT: SIDEBAR ESQUERDA + PAINEL DE DETALHES DIREITA
         =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================
            COLUNA DA ESQUERDA: SIDEBAR DE NAVEGAÇÃO EM SANFONA (ACCORDION)
           ================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-[#0C0F17]/90 border border-white/10 rounded-3xl p-3 shadow-xl backdrop-blur-xl max-h-[750px] overflow-y-auto custom-scrollbar">
            <div className="px-3 py-2 border-b border-white/5 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Categorias & Tópicos
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {filteredCategories.reduce((acc, c) => acc + c.items.length, 0)} itens listados
              </span>
            </div>

            <div className="space-y-2">
              {filteredCategories.map((category) => {
                const isCollapsed = Boolean(collapsedCategories[category.id]);
                const categoryUnlockedCount = category.items.filter((i) =>
                  i.type === "levels"
                    ? getCharacteristicLevel(unlocked, i.id) > 0
                    : unlocked.includes(i.id)
                ).length;

                return (
                  <div
                    key={category.id}
                    className="border border-white/5 rounded-2xl overflow-hidden bg-black/20 transition-all"
                  >
                    {/* Accordion Category Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
                          style={{
                            backgroundColor: faction.bgGlow,
                            borderColor: `${faction.color}40`,
                            color: faction.color,
                          }}
                        >
                          {renderCategoryIcon(category.iconName, "w-3.5 h-3.5")}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {category.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {categoryUnlockedCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            {categoryUnlockedCount}/{category.items.length}
                          </span>
                        )}
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Items List */}
                    {!isCollapsed && (
                      <div className="p-1.5 pt-0 space-y-1 border-t border-white/5">
                        {category.items.map((item) => {
                          const isSelected = item.id === selectedItemId;
                          const isItemLevelBased = item.type === "levels";
                          const itemLevel = isItemLevelBased
                            ? getCharacteristicLevel(unlocked, item.id)
                            : 0;
                          const isItemUnlocked = isItemLevelBased
                            ? itemLevel > 0
                            : unlocked.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedItemId(item.id)}
                              className={`w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between text-xs font-mono cursor-pointer border ${
                                isSelected
                                  ? "bg-[#141B28] text-white font-bold shadow-md"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: `${faction.color}60`,
                                      boxShadow: `0 0 15px ${faction.color}20`,
                                    }
                                  : {}
                              }
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    isItemUnlocked ? "bg-emerald-400" : "bg-slate-600"
                                  }`}
                                />
                                <span className="truncate">{item.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isItemLevelBased ? (
                                  itemLevel >= 5 ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                                      <Award className="w-2.5 h-2.5" />
                                      Mestria V
                                    </span>
                                  ) : itemLevel > 0 ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      Nível {ROMAN_LEVELS[itemLevel - 1]} ({itemLevel}/5)
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 px-1 py-0.5">
                                      5 Níveis
                                    </span>
                                  )
                                ) : isItemUnlocked ? (
                                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Check className="w-2.5 h-2.5" />
                                    Adquirido
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 px-1 py-0.5">
                                    Benefícios
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =================================================================
            COLUNA DA DIREITA: PAINEL DE DETALHES DA CARACTERÍSTICA SELECIONADA
           ================================================================= */}
        <div className="lg:col-span-7">
          <div className="bg-[#0C0F17]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
            {/* Top decorative accent */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[90px] pointer-events-none opacity-20"
              style={{ backgroundColor: faction.color }}
            />

            {/* Item Title & Metadata Badges */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border font-semibold"
                    style={{
                      backgroundColor: faction.bgGlow,
                      borderColor: `${faction.color}40`,
                      color: faction.color,
                    }}
                  >
                    {selectedCategory?.name || selectedItem.category}
                  </span>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                    {selectedItem.type === "levels"
                      ? "Progressão de 5 Níveis"
                      : "Benefícios Operacionais"}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-100 tracking-tight">
                  {selectedItem.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1 leading-relaxed">
                  {selectedItem.summary}
                </p>
              </div>

              {/* Status Pill in Header */}
              <div className="flex-shrink-0">
                {isLevelBased ? (
                  isMaxLevel ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-black shadow-md">
                      <Award className="w-4 h-4 text-emerald-300" />
                      <span>Mestria Máxima (V/V)</span>
                    </div>
                  ) : currentLevel > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-mono font-bold shadow-md">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Nível {ROMAN_LEVELS[currentLevel - 1]} Ativo ({currentLevel}/5)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 text-xs font-mono">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nenhum Nível Adquirido (0/5)</span>
                    </div>
                  )
                ) : isBenefitUnlocked ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-md">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Licença Ativa</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 text-xs font-mono">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Não Adquirida</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content: Progression Levels OR Tactical Benefits */}
            <div className="space-y-4">
              {selectedItem.type === "levels" && selectedItem.levels && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                      Escala de Mestria (Níveis I a V) • Aquisição Dependente
                    </span>
                    <span className="text-[10px] font-mono text-amber-400/80">
                      Progresso: {currentLevel} de 5 Níveis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedItem.levels.map((lvl, index) => {
                      const levelNum = index + 1;
                      const isOwned = levelNum <= currentLevel;
                      const isNext = levelNum === currentLevel + 1;
                      const isLocked = levelNum > currentLevel + 1;

                      return (
                        <div
                          key={index}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isOwned
                              ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200 shadow-sm"
                              : isNext
                              ? "bg-amber-950/15 border-amber-500/40 text-slate-200 shadow-md shadow-amber-950/20"
                              : "bg-black/25 border-white/5 text-slate-500 opacity-60"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div
                              className="px-2.5 py-1 rounded-xl text-xs font-mono font-black border flex-shrink-0 shadow-sm"
                              style={{
                                backgroundColor: isOwned
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : isNext
                                  ? "rgba(245, 158, 11, 0.2)"
                                  : "rgba(255, 255, 255, 0.05)",
                                borderColor: isOwned
                                  ? "rgba(16, 185, 129, 0.4)"
                                  : isNext
                                  ? "rgba(245, 158, 11, 0.4)"
                                  : "rgba(255, 255, 255, 0.1)",
                                color: isOwned
                                  ? "#6EE7B7"
                                  : isNext
                                  ? "#FCD34D"
                                  : "#64748B",
                              }}
                            >
                              {lvl.level}
                            </div>
                            <p
                              className={`text-xs font-sans leading-relaxed ${
                                isLocked ? "text-slate-500" : "text-slate-200"
                              }`}
                            >
                              {lvl.desc}
                            </p>
                          </div>

                          {/* Level Action / Status Badge */}
                          <div className="flex-shrink-0 self-end sm:self-center">
                            {isOwned ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Adquirido</span>
                              </div>
                            ) : isNext ? (
                              points > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handlePurchase(levelNum)}
                                  disabled={isPurchasing}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-mono font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <Sparkles className="w-3 h-3 text-black" />
                                  <span>Adquirir (1 Ponto)</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-[10px] font-mono">
                                  <Lock className="w-3 h-3" />
                                  <span>Próximo Nível (0 Pts)</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 px-2 py-1">
                                <Lock className="w-3 h-3 text-slate-600" />
                                <span>Requer Nível {ROMAN_LEVELS[levelNum - 2]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.type === "benefits" && selectedItem.benefits && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                    Vantagens & Benefícios Concedidos
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedItem.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
                          isBenefitUnlocked
                            ? "bg-emerald-950/15 border-emerald-500/30 text-slate-200"
                            : "bg-black/30 border-white/5 text-slate-300"
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-500/10 text-emerald-400">
                          <Check className="w-3 h-3" />
                        </div>
                        <p className="text-xs font-sans leading-relaxed">
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =================================================================
                ACTION FOOTER: REGRAS E BOTÃO DE AQUISIÇÃO
               ================================================================= */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-mono">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                  Custo por Nível / Licença
                </span>
                <span className="text-slate-300 font-bold flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  1 Ponto de Característica
                </span>
              </div>

              {/* Action Button depending on purchase status and points */}
              <div>
                {isLevelBased ? (
                  isMaxLevel ? (
                    <button
                      disabled
                      type="button"
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Mestria Máxima Atingida (Nível V)</span>
                    </button>
                  ) : points > 0 ? (
                    <button
                      type="button"
                      onClick={() => handlePurchase(currentLevel + 1)}
                      disabled={isPurchasing}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>
                        {isPurchasing
                          ? "Adquirindo..."
                          : `Adquirir Nível ${ROMAN_LEVELS[currentLevel]} (Custo: 1 Ponto)`}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-end">
                      <button
                        disabled
                        type="button"
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Adquirir Nível {ROMAN_LEVELS[currentLevel]} (Pontos Insuficientes)</span>
                      </button>
                      <span className="text-[10px] font-mono text-amber-400/80 mt-1">
                        Aguarde liberação de pontos pelo Mestre
                      </span>
                    </div>
                  )
                ) : isBenefitUnlocked ? (
                  <button
                    disabled
                    type="button"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Licença Adquirida</span>
                  </button>
                ) : points > 0 ? (
                  <button
                    type="button"
                    onClick={() => handlePurchase()}
                    disabled={isPurchasing}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>
                      {isPurchasing ? "Adquirindo..." : "Adquirir (Custo: 1 Ponto)"}
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-end">
                    <button
                      disabled
                      type="button"
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-bold bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Adquirir (Pontos Insuficientes)</span>
                    </button>
                    <span className="text-[10px] font-mono text-amber-400/80 mt-1">
                      Aguarde liberação de pontos pelo Mestre
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
