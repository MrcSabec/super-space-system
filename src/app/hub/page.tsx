"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Campaign, FactionId } from "@/types/sss";
import { getUserCampaigns, createCampaign, joinCampaignByCode } from "@/lib/db";
import { BrandLogo } from "@/components/BrandLogo";
import { CampaignCard } from "@/components/Hub/CampaignCard";
import { CreateCampaignModal } from "@/components/Hub/CreateCampaignModal";
import { JoinCampaignModal } from "@/components/Hub/JoinCampaignModal";
import {
  Plus,
  LogIn,
  LogOut,
  Sparkles,
  Compass,
  RefreshCw,
} from "lucide-react";

export default function HubPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Load campaigns
  const fetchCampaigns = useCallback(async (username: string) => {
    try {
      setLoadingCampaigns(true);
      const list = await getUserCampaigns(username);
      setCampaigns(list);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchCampaigns(user.username);
    }
  }, [user, authLoading, router, fetchCampaigns]);

  // Actions
  const handleCreateCampaign = async (data: {
    name: string;
    allowedFactions: FactionId[];
    initialPlanets: number;
  }) => {
    if (!user) return;
    const newCamp = await createCampaign({
      ...data,
      gmId: user.id,
      gmUsername: user.username,
    });
    await fetchCampaigns(user.username);
    // Directly redirect GM to their new map
    router.push(`/campaign/${newCamp.id}/gm`);
  };

  const handleJoinCampaign = async (code: string) => {
    if (!user) return;
    const camp = await joinCampaignByCode(code, user.username);
    await fetchCampaigns(user.username);
    // Redirect Player to Module 4
    router.push(`/campaign/${camp.id}/player`);
  };

  if (authLoading || (!user && !loadingCampaigns)) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E0E6ED] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0C0F17]/85 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" />
          <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
          <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-widest text-slate-400">
            Hub Central de Campanhas
          </span>
        </div>

        {/* User Session Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">@{user?.username}</span>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            title="Encerrar Sessão"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Banner Section with Quick Actions */}
        <section className="relative bg-gradient-to-br from-[#0E121E] via-[#0E1118] to-[#0A0C13] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
          {/* Subtle cosmic background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                Comando Estratégico
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
                Hub de Campanhas Galácticas
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
                Crie novos sistemas solares com órbitas automáticas para mestrar, ou digite o código de acesso para participar como jogador.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono font-semibold text-slate-200 hover:text-white transition-all shadow-md"
              >
                <LogIn className="w-4 h-4 text-indigo-400" />
                <span>Entrar em Campanha</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Campanha (Mestre)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 1: Minhas Campanhas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-100 font-sans">
                Minhas Campanhas
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] font-mono text-slate-400 border border-white/10">
                {campaigns.length}
              </span>
            </div>

            <button
              onClick={() => user && fetchCampaigns(user.username)}
              title="Atualizar lista"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCampaigns ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

          {/* Campaigns Grid */}
          {loadingCampaigns ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 bg-[#0E1118]/40 border border-white/5 rounded-2xl">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-500">
                Sincronizando sistemas estelares...
              </span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center bg-[#0E1118]/40 border border-white/5 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-300">
                  Nenhuma campanha encontrada
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Você ainda não possui campanhas ativas. Crie um novo sistema estelar como Mestre ou utilize um código para entrar em uma mesa.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono rounded-xl text-slate-300"
                >
                  Entrar com Código
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-mono text-sky-200 rounded-xl"
                >
                  Criar Nova Campanha
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  currentUsername={user?.username || ""}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCampaign}
      />

      <JoinCampaignModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinCampaign}
      />
    </div>
  );
}
