"use client";

import React from "react";
import {
  ResourceKey,
  QualitativeResource,
  ResourceStockLevel,
  ResourceFluxLevel,
} from "@/types/sss";
import {
  EOS_OMEGA_RESOURCES,
  STOCK_STAGES,
  FLUX_STAGES,
  getStockStage,
  getFluxStage,
} from "@/lib/resources";
import {
  Droplets,
  Wheat,
  Bug,
  Layers,
  Shield,
  Gem,
  Radiation,
  Flame,
  Sparkles,
  Package,
  AlertTriangle,
  Lock,
  Radio,
} from "lucide-react";

interface ResourceMeterGridProps {
  resources: Record<ResourceKey, QualitativeResource>;
  readOnly?: boolean;
  factionColor?: string;
  onChangeStock?: (key: ResourceKey, level: ResourceStockLevel) => void;
  onChangeFlux?: (key: ResourceKey, level: ResourceFluxLevel) => void;
}

export const ResourceMeterGrid: React.FC<ResourceMeterGridProps> = ({
  resources,
  readOnly = false,
  factionColor = "#38bdf8",
  onChangeStock,
  onChangeFlux,
}) => {
  const renderResourceIcon = (iconName: string, color: string) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0", style: { color } };
    switch (iconName) {
      case "Droplets":
        return <Droplets {...iconProps} />;
      case "Wheat":
        return <Wheat {...iconProps} />;
      case "Bug":
        return <Bug {...iconProps} />;
      case "Layers":
      case "Box":
        return <Layers {...iconProps} />;
      case "Shield":
        return <Shield {...iconProps} />;
      case "Gem":
        return <Gem {...iconProps} />;
      case "Radiation":
        return <Radiation {...iconProps} />;
      case "Flame":
        return <Flame {...iconProps} />;
      case "Sparkles":
        return <Sparkles {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {EOS_OMEGA_RESOURCES.map((res) => {
        const item = resources[res.key] || {
          estoque: "suficiente",
          entrada: "nenhum",
        };

        const activeStock = getStockStage(item.estoque);
        const activeFlux = getFluxStage(item.entrada);
        const activeStockIndex = activeStock.index;
        const activeFluxIndex = activeFlux.index;

        return (
          <div
            key={res.key}
            className="group relative bg-[#0C0F17]/90 hover:bg-[#0E121C] border border-white/10 hover:border-white/20 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 shadow-xl flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Background Aura */}
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-15 group-hover:opacity-30 transition-opacity"
              style={{ backgroundColor: res.accentColor }}
            />

            {/* ============================================================
                1. O NOME ACIMA (Top Resource Identity Header)
               ============================================================ */}
            <div className="flex items-center justify-between gap-2 mb-3.5 z-10 pb-2.5 border-b border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: `${res.accentColor}18`,
                    borderColor: `${res.accentColor}40`,
                  }}
                >
                  {renderResourceIcon(res.iconName, res.accentColor)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans truncate">
                    {res.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: res.accentColor }}
                    />
                    <span className="capitalize">{res.category}</span>
                  </div>
                </div>
              </div>

              {/* Status Readout Mode Badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {readOnly ? (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-black/40 text-slate-400 flex items-center gap-1 select-none"
                    title="Visão do Jogador (Read-Only)"
                  >
                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                    RO
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold select-none flex items-center gap-1"
                    title="Controle Total do Mestre (Clique para alterar)"
                  >
                    <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                    GM
                  </span>
                )}
              </div>
            </div>

            {/* ============================================================
                2. BARRAS MÉTRICAS COM NOMES ACIMA
               ============================================================ */}
            <div className="space-y-4 z-10">
              {/* ----------------------------------------------------------
                  BARRA MÉTRICA 1: ESTOQUE (Stock Level Gauge)
                  O Nome Acima: "ESTOQUE: [STATUS]"
                 ---------------------------------------------------------- */}
              <div className="space-y-1.5">
                {/* Nome e Indicador Acima da Barra */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] uppercase tracking-widest text-slate-300 font-bold flex items-center gap-1.5">
                    {item.estoque === "vazios" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    )}
                    Estoque
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider transition-colors ${activeStock.badgeBg}`}
                  >
                    {activeStock.label}
                  </span>
                </div>

                {/* A Barra Métrica Calibrada (4 Segmentos / Ticks) */}
                <div className="p-1 bg-black/60 border border-white/10 rounded-xl">
                  <div className="grid grid-cols-4 gap-1.5 h-3.5">
                    {STOCK_STAGES.map((stage) => {
                      const isSelected = item.estoque === stage.id;
                      const isFilled = stage.index <= activeStockIndex;

                      // Barra métrica fill aesthetic
                      let barStyle = "bg-white/5 border border-white/5";

                      if (item.estoque === "vazios") {
                        if (stage.index === 0) {
                          barStyle =
                            "bg-red-500 border border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse";
                        }
                      } else if (item.estoque === "transbordando") {
                        barStyle =
                          "bg-gradient-to-r from-purple-500 to-fuchsia-400 border border-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.5)]";
                      } else if (isFilled) {
                        if (stage.index === 0) {
                          barStyle =
                            "bg-sky-500/80 border border-sky-400/80 shadow-[0_0_6px_rgba(56,189,248,0.3)]";
                        } else if (stage.index === 1) {
                          barStyle =
                            "bg-sky-400 border border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]";
                        } else if (stage.index === 2) {
                          barStyle =
                            "bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]";
                        }
                      }

                      if (readOnly) {
                        return (
                          <div
                            key={stage.id}
                            className={`h-full rounded-md transition-all duration-300 relative overflow-hidden select-none ${barStyle}`}
                            title={`${stage.label}: ${stage.description}`}
                          >
                            {/* Calibrated Center Tick Line */}
                            <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 -translate-x-1/2 pointer-events-none" />
                          </div>
                        );
                      }

                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => onChangeStock && onChangeStock(res.key, stage.id)}
                          className={`h-full rounded-md transition-all duration-200 relative overflow-hidden cursor-pointer hover:brightness-125 active:scale-95 ${barStyle} ${
                            isSelected ? "ring-1 ring-white/70" : "hover:border-white/30"
                          }`}
                          title={`Clique para definir Estoque como "${stage.label}"`}
                        >
                          {/* Calibrated Center Tick Line */}
                          <div className="absolute inset-y-0 left-1/2 w-px bg-white/30 -translate-x-1/2 pointer-events-none" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Graduações / Rótulos da Régua Métrica abaixo da barra */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-[9px] font-mono tracking-tight text-center">
                    {STOCK_STAGES.map((stage) => {
                      const isSelected = item.estoque === stage.id;
                      return (
                        <span
                          key={stage.id}
                          className={`truncate transition-colors ${
                            isSelected
                              ? "font-bold text-slate-100"
                              : "text-slate-500 opacity-60"
                          }`}
                        >
                          {stage.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------
                  BARRA MÉTRICA 2: ENTRADA (Flux Level Gauge)
                  O Nome Acima: "ENTRADA / FLUXO: [STATUS]"
                 ---------------------------------------------------------- */}
              <div className="space-y-1.5">
                {/* Nome e Indicador Acima da Barra */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                    Entrada (Fluxo)
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider transition-colors ${activeFlux.badgeBg}`}
                  >
                    <span className="mr-1">{activeFlux.symbol}</span>
                    {activeFlux.label}
                  </span>
                </div>

                {/* A Barra Métrica de Fluxo Calibrada */}
                <div className="p-1 bg-black/60 border border-white/10 rounded-xl">
                  <div className="grid grid-cols-4 gap-1.5 h-3">
                    {FLUX_STAGES.map((stage) => {
                      const isSelected = item.entrada === stage.id;

                      let barStyle = "bg-white/5 border border-white/5";

                      if (isSelected) {
                        if (stage.id === "faltando") {
                          barStyle =
                            "bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                        } else if (stage.id === "nenhum") {
                          barStyle =
                            "bg-slate-400 border border-slate-300 shadow-[0_0_6px_rgba(148,163,184,0.4)]";
                        } else if (stage.id === "emergente") {
                          barStyle =
                            "bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                        } else if (stage.id === "enorme") {
                          barStyle =
                            "bg-cyan-400 border border-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.6)]";
                        }
                      }

                      if (readOnly) {
                        return (
                          <div
                            key={stage.id}
                            className={`h-full rounded-md transition-all duration-300 relative overflow-hidden select-none flex items-center justify-center ${barStyle}`}
                            title={`${stage.label} (${stage.symbol}): ${stage.description}`}
                          >
                            <span className="text-[8px] font-mono font-bold opacity-80">
                              {stage.symbol}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => onChangeFlux && onChangeFlux(res.key, stage.id)}
                          className={`h-full rounded-md transition-all duration-200 relative overflow-hidden cursor-pointer hover:brightness-125 active:scale-95 flex items-center justify-center ${barStyle} ${
                            isSelected ? "ring-1 ring-white/70" : "hover:border-white/30"
                          }`}
                          title={`Clique para definir Entrada como "${stage.label}" (${stage.symbol})`}
                        >
                          <span className="text-[8px] font-mono font-bold">
                            {stage.symbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Rótulos da Régua de Fluxo abaixo da barra */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-[9px] font-mono tracking-tight text-center">
                    {FLUX_STAGES.map((stage) => {
                      const isSelected = item.entrada === stage.id;
                      return (
                        <span
                          key={stage.id}
                          className={`truncate transition-colors ${
                            isSelected
                              ? "font-bold text-slate-100"
                              : "text-slate-500 opacity-60"
                          }`}
                        >
                          {stage.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
