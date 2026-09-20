"use client";

import React, { useState } from "react";
import { PlayerCharacter } from "@/types/sss";
import { getFaction } from "@/lib/factions";
import {
  EOS_CHARACTERISTICS_CATEGORIES,
  TOTAL_CHARACTERISTICS_COUNT,
  ROMAN_LEVELS,
  getCharacteristicLevel,
  setCharacteristicLevelInList,
  countUnlockedCharacteristics,
  countTotalPurchasedRanks,
  CharacteristicItem,
} from "@/lib/eosCharacteristics";
import { savePlayerCharacter } from "@/lib/db";
import {
  X,
  Sparkles,
  Users,
  Search,
  Check,
  Plus,
  Minus,
  Award,
  BookOpen,
} from "lucide-react";

interface PlayerCharacteristicsAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: PlayerCharacter[];
  campaignName: string;
  onUpdateCharacter?: (char: PlayerCharacter) => Promise<void>;
}

export const PlayerCharacteristicsAuditModal: React.FC<PlayerCharacteristicsAuditModalProps> = ({
  isOpen,
  onClose,
  characters,
  campaignName,
  onUpdateCharacter,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdatePoints = async (char: PlayerCharacter, delta: number) => {
    const current = char.characteristic_points ?? 2;
    const next = Math.max(0, current + delta);
    const updated: PlayerCharacter = {
      ...char,
      characteristic_points: next,
      updatedAt: Date.now(),
    };
    try {
      if (onUpdateCharacter) {
        await onUpdateCharacter(updated);
      } else {
        await savePlayerCharacter(updated);
      }
      showToast(`${char.characterName}: Saldo alterado para ${next} Pts.`);
    } catch (err) {
      console.error("Erro ao atualizar pontos:", err);
    }
  };

  const handleToggleOrLevelPerk = async (
    char: PlayerCharacter,
    item: CharacteristicItem,
    targetLevel?: number
  ) => {
    const unlocked = char.unlocked_characteristics || [];
    let nextUnlocked: string[];
    let actionDesc = "";

    if (item.type === "levels") {
      const curLvl = getCharacteristicLevel(unlocked, item.id);
      const nextLvl = targetLevel !== undefined ? targetLevel : curLvl >= 5 ? 0 : curLvl + 1;
      nextUnlocked = setCharacteristicLevelInList(unlocked, item.id, nextLvl);
      actionDesc = nextLvl === 0 ? `removeu ${item.name}` : `alterou ${item.name} para Nível ${ROMAN_LEVELS[nextLvl - 1]}`;
    } else {
      if (unlocked.includes(item.id)) {
        nextUnlocked = unlocked.filter((id) => id !== item.id);
        actionDesc = `removeu ${item.name}`;
      } else {
        nextUnlocked = [...unlocked, item.id];
        actionDesc = `desbloqueou ${item.name}`;
      }
    }

    const updated: PlayerCharacter = {
      ...char,
      unlocked_characteristics: nextUnlocked,
      updatedAt: Date.now(),
    };

    try {
      if (onUpdateCharacter) {
        await onUpdateCharacter(updated);
      } else {
        await savePlayerCharacter(updated);
      }
      showToast(`${char.characterName}: ${actionDesc}`);
    } catch (err) {
      console.error("Erro ao atualizar característica:", err);
    }
  };

  // Find all items mapped with category metadata
  const allItemsWithCategory = EOS_CHARACTERISTICS_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryMeta: cat }))
  );

  // Filtered characters
  const activeCharacters =
    selectedCharId === "all"
      ? characters
      : characters.filter((c) => c.id === selectedCharId);

  // Total metrics
  const totalDistributedPoints = characters.reduce(
    (acc, c) => acc + (c.characteristic_points ?? 2),
    0
  );
  const totalUnlockedAcrossAll = characters.reduce(
    (acc, c) => acc + countUnlockedCharacteristics(c.unlocked_characteristics || []),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[98vw] xl:max-w-[1450px] max-h-[95vh] bg-[#0C0F17] border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-black/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">
                  Arquivo de Conhecimento • Características dos Jogadores
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
                  Auditoria do Mestre
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Acompanhe e gerencie as licenças, níveis e perks adquiridos pelos governantes com pontos • {campaignName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 animate-in fade-in duration-150">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toolbar: Filter by Player + Search + Category + View Mode */}
        <div className="px-5 py-3 border-b border-white/5 bg-[#090C12] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Player Selection Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCharId("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                selectedCharId === "all"
                  ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              Todos os Impérios ({characters.length})
            </button>
            {characters.map((char) => {
              const fac = getFaction(char.factionId);
              const isSelected = selectedCharId === char.id;
              const unlockedCount = countUnlockedCharacteristics(char.unlocked_characteristics || []);
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedCharId(char.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                    isSelected
                      ? "bg-white/15 text-white border-white/40 shadow-sm"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: fac.color }}
                  />
                  <span className="font-bold truncate max-w-[130px]">{char.characterName}</span>
                  <span className="text-[10px] opacity-75 font-mono">({unlockedCount})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar característica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400/50"
            >
              <option value="all">Todas Categorias</option>
              {EOS_CHARACTERISTICS_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Toggle Full Catalog Mode */}
            <button
              type="button"
              onClick={() => setShowFullCatalog(!showFullCatalog)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                showFullCatalog
                  ? "bg-sky-500/20 text-sky-200 border-sky-400/50"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
              title="Alternar entre ver apenas as compradas ou todo o catálogo de licenças"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {showFullCatalog ? "Ver Somente Adquiridas" : "Ver Catálogo Completo"}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Body: Player Empire Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {activeCharacters.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Nenhum império encontrado para exibição.</p>
            </div>
          ) : (
            activeCharacters.map((char) => {
              const fac = getFaction(char.factionId);
              const unlockedList = char.unlocked_characteristics || [];
              const points = char.characteristic_points ?? 2;
              const unlockedCount = countUnlockedCharacteristics(unlockedList);
              const totalRanks = countTotalPurchasedRanks(unlockedList);

              // Gather purchased characteristics
              const purchasedItems = allItemsWithCategory.filter((item) => {
                if (item.type === "levels") {
                  return getCharacteristicLevel(unlockedList, item.id) > 0;
                }
                return unlockedList.includes(item.id);
              });

              // Apply search & category filter
              const filteredPurchased = purchasedItems.filter((item) => {
                const matchCat =
                  selectedCategory === "all" || item.category === selectedCategory;
                const matchSearch =
                  !searchQuery.trim() ||
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.summary.toLowerCase().includes(searchQuery.toLowerCase());
                return matchCat && matchSearch;
              });

              // If showFullCatalog is enabled, show all categories
              const displayCategories = EOS_CHARACTERISTICS_CATEGORIES.map((cat) => {
                const items = cat.items.filter((item) => {
                  const matchCat =
                    selectedCategory === "all" || cat.name === selectedCategory;
                  const matchSearch =
                    !searchQuery.trim() ||
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.summary.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchCat && matchSearch;
                });
                return { ...cat, items };
              }).filter((cat) => cat.items.length > 0);

              return (
                <div
                  key={char.id}
                  className="rounded-3xl border border-white/10 bg-[#0A0D15] p-5 shadow-xl space-y-4"
                  style={{ borderColor: `${fac.color}35` }}
                >
                  {/* Card Header: Leader Profile & Points Control */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg ring-2 ring-white/10"
                        style={{ backgroundColor: fac.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100 font-sans">
                            {char.characterName}
                          </h4>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold uppercase"
                            style={{
                              backgroundColor: `${fac.color}20`,
                              color: fac.color,
                              borderColor: `${fac.color}40`,
                            }}
                          >
                            {fac.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {char.leaderTitle} • @{char.username}
                        </p>
                      </div>
                    </div>

                    {/* Points & Stats Control Box */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/60 border border-white/10">
                        <span className="text-[11px] font-mono text-slate-400">
                          Licenças Ativas:
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {unlockedCount}/{TOTAL_CHARACTERISTICS_COUNT}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({totalRanks} Tiers)
                        </span>
                      </div>

                      {/* Points Modifier Buttons */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                        <span className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pontos Disponíveis:</span>
                        </span>
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePoints(char, -1)}
                            className="w-5 h-5 rounded bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition-colors"
                            title="Deduzir 1 ponto de característica"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-xs min-w-[28px] text-center">
                            {points}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePoints(char, +1)}
                            className="w-5 h-5 rounded bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition-colors"
                            title="Conceder 1 ponto de característica"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  {!showFullCatalog ? (
                    /* VIEW A: ONLY PURCHASED CHARACTERISTICS (Default Audit View) */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Características Compradas pelo Jogador ({filteredPurchased.length}):</span>
                        </span>
                        {filteredPurchased.length > 0 && (
                          <span className="text-[10px] font-mono text-slate-500">
                            Passe o mouse ou clique para inspecionar os efeitos
                          </span>
                        )}
                      </div>

                      {filteredPurchased.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-black/30 border border-dashed border-white/10 text-center space-y-1.5">
                          <BookOpen className="w-6 h-6 text-slate-600 mx-auto" />
                          <p className="text-xs font-mono text-slate-400">
                            {purchasedItems.length === 0
                              ? "O jogador ainda não adquiriu nenhuma característica com seus pontos."
                              : "Nenhuma característica adquirida corresponde aos filtros de busca."}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {points > 0
                              ? `O jogador possui ${points} ponto(s) disponíveis para gastar no Catálogo de Conhecimento.`
                              : "O jogador gastou todos os pontos ou aguarda novas concessões do Mestre."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredPurchased.map((item) => {
                            const isLevels = item.type === "levels";
                            const curLvl = isLevels ? getCharacteristicLevel(unlockedList, item.id) : 0;
                            const activeLevelDesc =
                              isLevels && item.levels && curLvl > 0
                                ? item.levels[curLvl - 1]?.desc
                                : null;

                            return (
                              <div
                                key={item.id}
                                className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 hover:border-white/20 transition-all flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  {/* Item Header */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-bold uppercase">
                                      {item.category}
                                    </span>
                                    {isLevels ? (
                                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Nível {ROMAN_LEVELS[curLvl - 1]} ({curLvl}/5)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Ativa
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="text-sm font-bold text-slate-100 font-sans">
                                    {item.name}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                                    {item.summary}
                                  </p>

                                  {/* Level Description or Benefits list */}
                                  {isLevels && activeLevelDesc && (
                                    <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] font-sans text-emerald-200 leading-snug">
                                      <strong className="block text-[10px] font-mono text-emerald-400 uppercase">
                                        Efeito de Nível {ROMAN_LEVELS[curLvl - 1]}:
                                      </strong>
                                      {activeLevelDesc}
                                    </div>
                                  )}

                                  {!isLevels && item.benefits && (
                                    <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/20 space-y-1">
                                      <strong className="block text-[10px] font-mono text-sky-400 uppercase">
                                        Bônus Ativos:
                                      </strong>
                                      <ul className="text-[10px] font-sans text-slate-300 space-y-0.5 list-disc list-inside">
                                        {item.benefits.map((b, bIdx) => (
                                          <li key={bIdx}>{b}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Quick Mestre Modifier: Revoke or Increase level */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                  <span>Controle Mestre:</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleOrLevelPerk(char, item, Math.max(0, curLvl - 1))}
                                      className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 transition-colors"
                                      title="Diminuir nível ou revogar característica"
                                    >
                                      - Nível
                                    </button>
                                    {isLevels && curLvl < 5 && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOrLevelPerk(char, item, curLvl + 1)}
                                        className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 transition-colors"
                                        title="Elevar para o próximo nível"
                                      >
                                        + Nível
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* VIEW B: FULL KNOWLEDGE CATALOG FOR THIS PLAYER */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
                          Catálogo Completo de Licenças (Clique para desbloquear ou alterar para este jogador):
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                                {cat.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {cat.items.length} itens
                              </span>
                            </div>

                            <div className="space-y-2">
                              {cat.items.map((item) => {
                                const isLevels = item.type === "levels";
                                const curLvl = isLevels
                                  ? getCharacteristicLevel(unlockedList, item.id)
                                  : 0;
                                const isUnlocked = isLevels
                                  ? curLvl > 0
                                  : unlockedList.includes(item.id);

                                return (
                                  <div
                                    key={item.id}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                      isUnlocked
                                        ? "bg-amber-400/10 border-amber-400/30"
                                        : "bg-white/5 border-white/5 opacity-70 hover:opacity-100"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5 mb-1">
                                      <span className="text-xs font-bold text-slate-200 truncate">
                                        {item.name}
                                      </span>
                                      {isLevels ? (
                                        <span
                                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                            curLvl > 0
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : "bg-white/5 text-slate-500"
                                          }`}
                                        >
                                          {curLvl > 0 ? `Nv. ${ROMAN_LEVELS[curLvl - 1]}` : "Bloqueada"}
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                            isUnlocked
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : "bg-white/5 text-slate-500"
                                          }`}
                                        >
                                          {isUnlocked ? "Ativa" : "Bloqueada"}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[10px] text-slate-400 font-sans line-clamp-2 mb-2">
                                      {item.summary}
                                    </p>

                                    <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOrLevelPerk(char, item)}
                                        className={`px-2 py-0.5 rounded transition-all font-bold ${
                                          isUnlocked
                                            ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30"
                                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                                        }`}
                                      >
                                        {isLevels
                                          ? curLvl >= 5
                                            ? "Reiniciar (0)"
                                            : `Avançar p/ ${curLvl + 1}`
                                          : isUnlocked
                                          ? "Desativar"
                                          : "Ativar"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between flex-shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Total no Setor: <strong>{totalUnlockedAcrossAll}</strong> Licenças Adquiridas
              </span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-white/10" />
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
              <span>Cofre de Pontos: <strong>{totalDistributedPoints}</strong> Pts disponíveis</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
