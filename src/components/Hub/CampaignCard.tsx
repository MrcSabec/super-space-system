"use client";

import React, { useState } from "react";
import { Campaign } from "@/types/sss";
import { getFaction } from "@/lib/factions";
import { Crown, User as UserIcon, Copy, Check, ArrowUpRight, Globe } from "lucide-react";
import Link from "next/link";

interface CampaignCardProps {
  campaign: Campaign;
  currentUsername: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  currentUsername,
}) => {
  const [copied, setCopied] = useState(false);
  const isGM = campaign.gmUsername.toLowerCase() === currentUsername.toLowerCase();
  const route = isGM ? `/campaign/${campaign.id}/gm` : `/campaign/${campaign.id}/player`;

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(campaign.campaignCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createdDate = new Date(campaign.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative bg-[#0E1118] border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/5 flex flex-col justify-between overflow-hidden">
      {/* Subtle top edge glow */}
      <div className={`h-1 w-full absolute top-0 left-0 ${isGM ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-sky-400 to-indigo-500"}`} />

      <div>
        {/* Top badges: Role & Code */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {isGM ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                <Crown className="w-3 h-3 text-amber-400" />
                MESTRE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-400/10 text-sky-300 border border-sky-400/20">
                <UserIcon className="w-3 h-3 text-sky-400" />
                JOGADOR
              </span>
            )}
          </div>

          {/* Copyable Campaign Code */}
          <button
            onClick={copyCode}
            title="Copiar código da campanha"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 hover:bg-black/70 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <span>{campaign.campaignCode}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-500" />
            )}
          </button>
        </div>

        {/* Campaign Title */}
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
          {campaign.name}
        </h3>

        <p className="text-xs text-slate-400 font-mono mt-1">
          Criado em {createdDate} • Mestre: @{campaign.gmUsername}
        </p>

        {/* Campaign Metrics & Faction Dots */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Planetas Iniciais:
            </span>
            <span className="font-mono text-slate-200">{campaign.initialPlanets || 5}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Facções Habilitadas:</span>
            <div className="flex items-center gap-1">
              {campaign.allowedFactions?.map((fid) => {
                const fac = getFaction(fid);
                return (
                  <span
                    key={fid}
                    title={fac.name}
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ backgroundColor: fac.color }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="mt-5 pt-3 border-t border-white/5">
        <Link
          href={route}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono font-semibold text-slate-200 hover:text-white transition-all group-hover:border-sky-500/30"
        >
          <span>Acessar Sistema</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
