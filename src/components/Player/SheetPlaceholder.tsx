"use client";

import React from "react";
import { Hammer, Sparkles, Shield, Cpu, Activity, Zap } from "lucide-react";
import { Campaign } from "@/types/sss";

interface SheetPlaceholderProps {
  campaign: Campaign;
  currentUsername: string;
}

export const SheetPlaceholder: React.FC<SheetPlaceholderProps> = ({
  campaign,
  currentUsername,
}) => {
  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center justify-center overflow-y-auto">
      <div className="max-w-3xl w-full bg-[#0E1118]/80 border border-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10 mb-4">
            <Hammer className="w-8 h-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Próxima Iteração
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
            Módulo de Ficha em Construção
          </h2>

          <p className="mt-3 text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
            Esta área será populada futuramente com formulários modulares (
            <span className="text-slate-200 font-semibold">Atributos</span>,{" "}
            <span className="text-slate-200 font-semibold">Recursos</span>,{" "}
            <span className="text-slate-200 font-semibold">Satisfação</span> e{" "}
            <span className="text-slate-200 font-semibold">Características Especiais</span>
            ) que definiremos na próxima iteração do projeto.
          </p>

          <p className="mt-2 text-xs font-mono text-slate-500">
            Setor: {campaign.name} • Jogador: @{currentUsername}
          </p>
        </div>

        {/* Future Modules Teaser Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/30 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">1. Atributos da Facção</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Métricas de Poderio Militar, Alcance de Propulsão, Eficiência Governamental e Capacidade de Pesquisa Científica.
            </p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">2. Recursos Estratégicos</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gestão de Créditos Galácticos, Minérios Raros, Biomassa Refinada e estoques energéticos da frota.
            </p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">3. Nível de Satisfação</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coesão das colônias, estabilidade civil planetária e monitoramento de riscos de revolta e desobediência.
            </p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">4. Características Especiais</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Doutrinas únicas, traços biológicos ou cibernéticos e cartas de comando tático exclusivas da sua facção.
            </p>
          </div>
        </div>

        {/* Notification pill */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-slate-500">
            Enquanto preparamos a ficha completa, acompanhe o mapa tático na aba &quot;Mapa Estelar&quot;.
          </p>
        </div>
      </div>
    </div>
  );
};
