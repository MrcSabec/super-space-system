"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Campaign, MapState, PlayerCharacter, User } from "@/types/sss";
import {
  getCampaign,
  subscribeCampaign,
  subscribeMapState,
  subscribeCampaignCharacters,
} from "@/lib/db";
import { GameStateProvider, useGameState } from "@/context/GameStateContext";
import { StarMapCanvas } from "@/components/StarMap/StarMapCanvas";
import { PlayerPillarsModal } from "@/components/GM/PlayerPillarsModal";
import { DiplomacyModal } from "@/components/GM/DiplomacyModal";
import { BrandLogo } from "@/components/BrandLogo";
import {
  ArrowLeft,
  Crown,
  Copy,
  Check,
  Users,
  Sliders,
  Handshake,
  Settings,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface GMMapContentProps {
  campaign: Campaign;
  user: User | null;
  copied: boolean;
  copyCode: () => void;
}

const GMMapContent: React.FC<GMMapContentProps> = ({
  campaign,
  user,
  copied,
  copyCode,
}) => {
  const {
    isLive,
    pendingCount,
    isApplying,
    toggleMode,
    effectiveMapState,
    effectiveCharacters,
    effectiveDiplomacy,
    updateMapState,
    updateCharacter,
    updateDiplomacy,
    applyBlueprint,
    discardBlueprint,
  } = useGameState();

  const [isPillarsModalOpen, setIsPillarsModalOpen] = useState(false);
  const [isDiplomacyModalOpen, setIsDiplomacyModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleApply = async () => {
    try {
      await applyBlueprint();
      setSuccessToast("🚀 Alterações aplicadas com sucesso via Firestore Batch!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch {
      alert("Erro ao aplicar alterações em lote no banco de dados.");
    }
  };

  return (
    <div className="w-screen h-screen bg-[#08090C] text-[#E0E6ED] flex flex-col overflow-hidden relative">
      {/* Visual Feedback of Blueprint Mode: Ambient Viewport Dashed Perimeter */}
      {!isLive && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-20 border-[3px] border-dashed border-amber-500/50 shadow-[inset_0_0_35px_rgba(245,158,11,0.18)] animate-pulse"
        />
      )}

      {/* Top Floating Master Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14 bg-[#0C0F17]/85 backdrop-blur-md border-b border-white/10 px-4 md:px-6 flex items-center justify-between pointer-events-auto">
        {/* Left: Hub back link + Campaign Title */}
        <div className="flex items-center gap-4">
          <Link
            href="/hub"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </Link>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-[180px] md:max-w-xs">
                {campaign.name}
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                <Crown className="w-3 h-3 text-amber-400" />
                MESTRE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden md:block">
              {effectiveMapState.planets?.length || 0} Planetas Órbitas •{" "}
              {effectiveMapState.troops?.length || 0} Frotas
            </p>
          </div>
        </div>

        {/* Center: Brand or Blueprint Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <BrandLogo size="sm" />
          </div>

          {!isLive && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 border border-amber-400/40 rounded-full shadow-lg backdrop-blur-md animate-in fade-in duration-200">
              <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 tracking-wider">
                MODO BLUEPRINT (RASCUNHO OFFLINE)
              </span>
            </div>
          )}
        </div>

        {/* Right: Passive Campaign Code & Player Counts */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{campaign.players?.length || 0} Jogadores</span>
          </div>

          {/* Copyable Campaign Code Button */}
          <button
            onClick={copyCode}
            title="Clique para copiar código de convite"
            className="flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/80 border border-sky-500/30 rounded-xl text-xs font-mono text-sky-300 transition-colors shadow-sm cursor-pointer"
          >
            <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
              CÓDIGO:
            </span>
            <span className="font-bold">{campaign.campaignCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-full pt-14 relative">
        <StarMapCanvas
          campaignId={campaign.id}
          mapState={effectiveMapState}
          onUpdateMapState={updateMapState}
          isGM={true}
          currentUser={user}
          campaignFactions={campaign.allowedFactions}
          allCharacters={effectiveCharacters}
          onOpenEmpiresModal={() => setIsPillarsModalOpen(true)}
          onOpenDiplomacyModal={() => setIsDiplomacyModalOpen(true)}
          isLiveMode={isLive}
          onToggleLiveMode={toggleMode}
        />
      </main>

      {/* Floating Blueprint Mode Commit/Apply Bar */}
      {!isLive && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || pendingCount === 0}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-mono font-bold text-xs sm:text-sm text-black transition-all shadow-2xl ${
              pendingCount > 0
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 shadow-orange-500/35 ring-2 ring-amber-400/80 hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-amber-400/35 text-black/50 shadow-none cursor-not-allowed"
            }`}
            title={
              pendingCount > 0
                ? "Comitar todas as mutações no banco de dados com Firestore writeBatch() atômico"
                : "Nenhuma mutação pendente para aplicar no momento"
            }
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Aplicando Batch no Firestore...</span>
              </>
            ) : (
              <>
                <span className="text-base sm:text-lg">🚀</span>
                <span>
                  Aplicar Alterações ({pendingCount}{" "}
                  {pendingCount === 1 ? "Pendente" : "Pendentes"})
                </span>
              </>
            )}
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={discardBlueprint}
              disabled={isApplying}
              className="px-3.5 py-3 rounded-2xl font-mono text-xs text-slate-300 hover:text-rose-300 bg-[#0C0F17]/90 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 shadow-xl backdrop-blur-md transition-all cursor-pointer"
              title="Descartar todas as alterações de rascunho e voltar para LIVE"
            >
              ✕ Descartar
            </button>
          )}
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-mono font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Fixed Right-Docked Minimalist Quick-Access GM Triggers */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsPillarsModalOpen(true)}
          title="Abrir Panóptico • Controle de Impérios"
          className="flex items-center gap-2 py-3 px-2.5 bg-[#0C0F17]/90 hover:bg-[#141A26] text-amber-300 hover:text-amber-200 border-y border-l border-amber-400/30 rounded-l-2xl shadow-xl backdrop-blur-md transition-all group cursor-pointer hover:border-amber-400/60"
        >
          <Sliders className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-mono font-bold tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase text-slate-300 group-hover:text-amber-200">
            Impérios
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setIsDiplomacyModalOpen(true)}
          title="Abrir Matriz Diplomática Global"
          className="flex items-center gap-2 py-3 px-2.5 bg-[#0C0F17]/90 hover:bg-[#141A26] text-sky-300 hover:text-sky-200 border-y border-l border-sky-400/30 rounded-l-2xl shadow-xl backdrop-blur-md transition-all group cursor-pointer hover:border-sky-400/60"
        >
          <Handshake className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-mono font-bold tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase text-slate-300 group-hover:text-sky-200">
            Diplomacia
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        </button>
      </div>

      {/* Player Empire Pillars Management Modal (GM Only) */}
      <PlayerPillarsModal
        isOpen={isPillarsModalOpen}
        onClose={() => setIsPillarsModalOpen(false)}
        characters={effectiveCharacters}
        campaignName={campaign.name}
        onUpdateCharacter={updateCharacter}
      />

      {/* Diplomacy Management Modal (GM Only) */}
      <DiplomacyModal
        isOpen={isDiplomacyModalOpen}
        onClose={() => setIsDiplomacyModalOpen(false)}
        campaign={{
          ...campaign,
          diplomatic_relations: effectiveDiplomacy,
        }}
        onUpdateDiplomacy={updateDiplomacy}
      />
    </div>
  );
};

export default function GMMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [mapState, setMapState] = useState<MapState>({
    planets: [],
    troops: [],
    updatedAt: Date.now(),
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load campaign and verify GM status
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && resolvedParams.id) {
      getCampaign(resolvedParams.id).then((camp) => {
        if (!camp) {
          router.push("/hub");
          return;
        }

        // Verify if GM
        const isGM = camp.gmUsername.toLowerCase() === user.username.toLowerCase();
        if (!isGM) {
          router.replace(`/campaign/${resolvedParams.id}/player`);
          return;
        }

        setCampaign(camp);
        setLoading(false);
      });
    }
  }, [user, authLoading, resolvedParams.id, router]);

  // Subscribe to real-time map & campaign updates
  useEffect(() => {
    if (!resolvedParams.id) return;

    const unsubscribe = subscribeMapState(resolvedParams.id, (incomingState) => {
      if (incomingState) {
        setMapState(incomingState);
      }
    });

    const unsubscribeChars = subscribeCampaignCharacters(
      resolvedParams.id,
      (chars) => {
        setCharacters(chars);
      }
    );

    const unsubscribeCampaign = subscribeCampaign(
      resolvedParams.id,
      (incomingCamp) => {
        if (incomingCamp) {
          setCampaign(incomingCamp);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeChars();
      unsubscribeCampaign();
    };
  }, [resolvedParams.id]);

  const copyCode = () => {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.campaignCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading || !campaign) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Carregando Sistema Solar...
          </span>
        </div>
      </div>
    );
  }

  return (
    <GameStateProvider
      campaignId={campaign.id}
      serverMapState={mapState}
      serverCharacters={characters}
      serverCampaign={campaign}
      onServerMapStateChange={setMapState}
      onServerCharactersChange={setCharacters}
      onServerCampaignChange={setCampaign}
    >
      <GMMapContent
        campaign={campaign}
        user={user}
        copied={copied}
        copyCode={copyCode}
      />
    </GameStateProvider>
  );
}
