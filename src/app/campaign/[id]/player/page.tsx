"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Campaign, MapState, PlayerCharacter, Troop } from "@/types/sss";
import {
  getCampaign,
  subscribeCampaign,
  subscribeMapState,
  saveMapState,
  saveMapTroops,
  subscribePlayerCharacter,
  savePlayerCharacter,
} from "@/lib/db";
import { StarMapCanvas } from "@/components/StarMap/StarMapCanvas";
import { CharacterWizard } from "@/components/Player/CharacterWizard";
import { PlayerDashboard } from "@/components/Player/PlayerDashboard";
import { BrandLogo } from "@/components/BrandLogo";
import { getFaction } from "@/lib/factions";
import {
  ArrowLeft,
  User as UserIcon,
  Orbit,
  LayoutDashboard,
  Radio,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    planets: [],
    troops: [],
    updatedAt: Date.now(),
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "map">("dashboard");
  const [loading, setLoading] = useState(true);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // 1. Load Campaign Details & Real-Time Subscription (including Diplomacy)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && resolvedParams.id) {
      let isMounted = true;
      getCampaign(resolvedParams.id)
        .then((camp) => {
          if (!isMounted) return;
          if (!camp) {
            router.push("/hub");
            return;
          }
          setCampaign(camp);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading campaign:", err);
          if (isMounted) setLoading(false);
        });

      const unsubscribeCamp = subscribeCampaign(resolvedParams.id, (incomingCamp) => {
        if (!isMounted) return;
        if (incomingCamp) {
          setCampaign(incomingCamp);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        unsubscribeCamp();
      };
    }
  }, [user, authLoading, resolvedParams.id, router]);

  // 2. Subscribe to Player Character Sheet (State A vs State B)
  useEffect(() => {
    if (!resolvedParams.id || !user) return;

    // Safety timer to prevent infinite loading loops under any network condition
    const safetyTimer = setTimeout(() => {
      setCharacterLoading(false);
    }, 1500);

    const unsubscribe = subscribePlayerCharacter(
      resolvedParams.id,
      user.username,
      (incomingChar) => {
        clearTimeout(safetyTimer);
        setCharacter(incomingChar);
        setCharacterLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [resolvedParams.id, user]);

  // 3. Subscribe to Real-Time Star Map Updates (Read-Only)
  useEffect(() => {
    if (!resolvedParams.id) return;

    const unsubscribe = subscribeMapState(resolvedParams.id, (incomingState) => {
      if (incomingState) {
        setMapState(incomingState);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [resolvedParams.id]);

  // Save/Update character handler
  const handleUpdateCharacter = async (updated: PlayerCharacter) => {
    setCharacter(updated);
    await savePlayerCharacter(updated);
  };

  // Update map state handler (placement of troops, drag & drop, etc.)
  const handleUpdateMapState = async (newState: MapState) => {
    setMapState(newState);
    if (campaign) {
      try {
        await saveMapState(campaign.id, newState);
      } catch (err) {
        console.error("Erro ao salvar estado geral do mapa:", err);
      }
    }
  };

  // Granular troop update handler (prevents planet overwrites)
  const handleUpdateTroops = async (newTroops: Troop[]) => {
    setMapState((prev) => ({ ...prev, troops: newTroops, updatedAt: Date.now() }));
    if (campaign) {
      try {
        await saveMapTroops(campaign.id, newTroops);
      } catch (err) {
        console.error("Erro ao salvar tropas no Firestore:", err);
      }
    }
  };

  const copyCode = () => {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.campaignCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading || characterLoading || !campaign || !user) {
    if (!loading && !campaign) {
      return (
        <div className="min-h-screen bg-[#08090C] flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-rose-400 font-mono text-xs">
              Setor não encontrado ou inacessível.
            </p>
            <Link
              href="/hub"
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-mono rounded-xl inline-block"
            >
              Voltar ao Hub
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Conectando aos sensores e registros do setor...
          </span>
        </div>
      </div>
    );
  }

  const faction = character ? getFaction(character.factionId) : null;

  return (
    <div className="w-screen h-screen bg-[#08090C] text-[#E0E6ED] flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 bg-[#0C0F17]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 flex items-center justify-between z-30 pointer-events-auto flex-shrink-0">
        {/* Left: Hub back link + Campaign Title */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/hub"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </Link>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <div className="truncate max-w-[140px] sm:max-w-xs">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 truncate">
                {campaign.name}
              </h1>
              {faction ? (
                <span
                  className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                  style={{
                    color: faction.color,
                    backgroundColor: faction.bgGlow,
                    borderColor: `${faction.color}40`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: faction.color }}
                  />
                  {faction.shortName}
                </span>
              ) : (
                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-400/10 text-sky-300 border border-sky-400/20">
                  <UserIcon className="w-3 h-3 text-sky-400" />
                  JOGADOR
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden md:block truncate">
              Mestre: @{campaign.gmUsername}
              {character && ` • ${character.leaderTitle} ${character.characterName}`}
            </p>
          </div>
        </div>

        {/* Center: Tabs Switcher (Only visible in STATE B when character exists) */}
        {character && (
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === "dashboard"
                  ? "bg-white/15 text-white font-semibold shadow-inner"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard
                className="w-3.5 h-3.5"
                style={{ color: faction?.color || "#8AB4F8" }}
              />
              <span>Ficha & HUD</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === "map"
                  ? "bg-white/15 text-white font-semibold shadow-inner"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-sky-400" />
              <span>Mapa Estelar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        )}

        {/* Right: Code & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={copyCode}
            title="Copiar código da campanha"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 hover:bg-black/70 border border-white/10 rounded-xl text-xs font-mono text-slate-300"
          >
            <span className="text-[10px] text-slate-500 uppercase hidden md:inline">CÓDIGO:</span>
            <span>{campaign.campaignCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <div className="hidden lg:block">
            <BrandLogo size="sm" />
          </div>
        </div>
      </header>

      {/* Main Area - Allows vertical scrolling for Wizard and Dashboard, fixed for Map */}
      <main
        className={`flex-1 w-full min-h-0 relative ${
          character && activeTab === "map"
            ? "h-[calc(100vh-3.5rem)] overflow-hidden"
            : "overflow-y-auto"
        }`}
      >
        {/* STATE A: Character Creation Wizard (First login) */}
        {!character ? (
          <CharacterWizard
            campaignId={campaign.id}
            campaignName={campaign.name}
            userId={user.id}
            username={user.username}
            allowedFactions={campaign.allowedFactions}
            onComplete={handleUpdateCharacter}
          />
        ) : (
          /* STATE B: Active Character Sheet Dashboard & Star Map */
          activeTab === "dashboard" ? (
            <PlayerDashboard
              campaign={campaign}
              character={character}
              mapState={mapState}
              onUpdateCharacter={handleUpdateCharacter}
            />
          ) : (
            <div className="w-full h-full relative">
              <StarMapCanvas
                campaignId={campaign.id}
                mapState={mapState}
                onUpdateMapState={handleUpdateMapState}
                onUpdateTroops={handleUpdateTroops}
                isGM={false}
                currentUser={user}
                character={character}
                allCharacters={character ? [character] : []}
                campaignFactions={campaign.allowedFactions}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
