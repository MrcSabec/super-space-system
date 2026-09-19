"use client";

import React, { useState, useEffect } from "react";
import {
  Planet,
  Troop,
  FactionId,
  PlanetSize,
  PlanetType,
  PlanetTemperature,
  PlanetAtmosphere,
  PlanetGravity,
  PlanetResource,
  ResourceLevel,
  AnomalousOrbit,
} from "@/types/sss";
import { ALL_FACTIONS_LIST, getFaction } from "@/lib/factions";
import {
  PLANET_SIZES,
  PLANET_TYPES,
  PLANET_TEMPERATURES,
  PLANET_ATMOSPHERES,
  PLANET_GRAVITIES,
  RESOURCE_LEVELS,
  ALL_PLANET_RESOURCES,
  SPECIAL_TRAITS,
  RESOURCE_THEMES,
  getResourceLevelArrows,
  generatePlanetStats,
  generateAnomalousOrbit,
  calibrateAnomalousOrbitToPlanet,
} from "@/lib/planetForge";
import {
  Trash2,
  X,
  Check,
  Globe,
  Shield,
  Dices,
  Sparkles,
  Orbit,
  Plus,
  Compass,
  Layers,
  Thermometer,
  Cloud,
  Weight,
  Wand2,
} from "lucide-react";

interface EntityModalProps {
  entity: Planet | Troop | null;
  entityType: "planet" | "troop";
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Planet | Troop) => void;
  onDelete: (id: string, type: "planet" | "troop") => void;
}

export const EntityModal: React.FC<EntityModalProps> = ({
  entity,
  entityType,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  // Common state
  const [name, setName] = useState("");
  const [factionId, setFactionId] = useState<FactionId>("neutral");
  const [notes, setNotes] = useState("");

  // Troop specific state
  const [angle, setAngle] = useState(0);

  // Planet Forge state
  const [planetSize, setPlanetSize] = useState<PlanetSize>("Médio");
  const [planetType, setPlanetType] = useState<PlanetType>("Sólido");
  const [temperature, setTemperature] = useState<PlanetTemperature>("Média");
  const [atmosphere, setAtmosphere] = useState<PlanetAtmosphere>("Respirável");
  const [gravity, setGravity] = useState<PlanetGravity>("Normal");
  const [resources, setResources] = useState<PlanetResource[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [allowRuinsInGen, setAllowRuinsInGen] = useState(false);
  const [resourceToAdd, setResourceToAdd] = useState(ALL_PLANET_RESOURCES[0]);

  // Anomalous Orbit state
  const [anomalousOrbit, setAnomalousOrbit] = useState<AnomalousOrbit>({
    enabled: false,
    centerX: 0,
    centerY: 0,
    radiusX: 100,
    radiusY: 70,
    rotation: 0,
  });

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setFactionId(entity.factionId);
      setNotes(entity.notes || "");

      if ("angle" in entity) {
        setAngle(entity.angle || 0);
      }

      if (entityType === "planet") {
        const p = entity as Planet;
        // Size normalization
        if (p.size === "Pequeno" || p.size === "Médio" || p.size === "Grande") {
          setPlanetSize(p.size);
        } else if (typeof p.size === "number") {
          setPlanetSize(p.size < 15 ? "Pequeno" : p.size > 20 ? "Grande" : "Médio");
        } else {
          setPlanetSize("Médio");
        }

        setPlanetType(p.type || "Sólido");
        setTemperature(p.temperature || "Média");
        setAtmosphere(p.atmosphere || "Respirável");
        setGravity(p.gravity || "Normal");
        setResources(p.resources || []);
        setTraits(p.traits || []);

        if (p.anomalousOrbit) {
          setAnomalousOrbit(p.anomalousOrbit);
        } else {
          const baseR = p.orbitRadius || 100;
          setAnomalousOrbit({
            enabled: false,
            centerX: 0,
            centerY: 0,
            radiusX: Math.round(baseR * 1.2),
            radiusY: Math.round(baseR * 0.75),
            rotation: 25,
          });
        }
      }
    }
  }, [entity, entityType]);

  if (!isOpen || !entity) return null;

  const currentFaction = getFaction(factionId);

  // Trigger procedural generator
  const handleRollProcedural = () => {
    const stats = generatePlanetStats({ allowRuins: allowRuinsInGen });
    setPlanetSize(stats.size);
    setPlanetType(stats.type);
    setTemperature(stats.temperature);
    setAtmosphere(stats.atmosphere);
    setGravity(stats.gravity);
    setResources(stats.resources);
    setTraits(stats.traits);
  };

  // Toggle trait
  const toggleTrait = (traitName: string) => {
    if (traits.includes(traitName)) {
      setTraits(traits.filter((t) => t !== traitName));
    } else {
      setTraits([...traits, traitName]);
    }
  };

  // Toggle resource level
  const cycleResourceLevel = (resourceName: string) => {
    setResources(
      resources.map((r) => {
        if (r.name !== resourceName) return r;
        const nextLevel: ResourceLevel =
          r.level === "Baixa" ? "Média" : r.level === "Média" ? "Alta" : "Baixa";
        return { ...r, level: nextLevel };
      })
    );
  };

  // Remove resource
  const removeResource = (resourceName: string) => {
    setResources(resources.filter((r) => r.name !== resourceName));
  };

  // Add resource
  const handleAddResource = () => {
    if (!resourceToAdd || resources.some((r) => r.name === resourceToAdd)) return;
    setResources([...resources, { name: resourceToAdd, level: "Média" }]);
  };

  // Auto-calibrate anomalous orbit to planet position centered at the sun (0, 0)
  const handleCalibrateOrbit = () => {
    if (!("x" in entity) || !("y" in entity)) return;
    const calibrated = calibrateAnomalousOrbitToPlanet(
      entity.x,
      entity.y,
      0,
      0,
      anomalousOrbit.rotation || 0,
      0.65
    );
    setAnomalousOrbit(calibrated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entityType === "planet") {
      onSave({
        ...entity,
        name: name.trim() || entity.name,
        factionId,
        size: planetSize,
        type: planetType,
        temperature,
        atmosphere,
        gravity,
        resources,
        traits,
        anomalousOrbit,
        notes,
      } as Planet);
    } else {
      onSave({
        ...entity,
        name: name.trim() || entity.name,
        factionId,
        angle,
        notes,
      } as Troop);
    }
    onClose();
  };

  return (
    <div
      data-hud="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="hud-element fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-default"
    >
      <div className="relative w-full max-w-2xl max-h-[94vh] bg-[#0C0F17] border border-sky-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header accent */}
        <div
          className="h-1.5 w-full transition-colors duration-300"
          style={{ backgroundColor: currentFaction.color }}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2 sm:p-2.5 rounded-2xl border"
              style={{
                backgroundColor: currentFaction.bgGlow,
                borderColor: `${currentFaction.color}40`,
              }}
            >
              {entityType === "planet" ? (
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentFaction.color }} />
              ) : (
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentFaction.color }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">
                  {entityType === "planet"
                    ? "Forja Planetária • Configurar Planeta"
                    : "Configurar Tropa"}
                </h3>
                {entityType === "planet" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold hidden sm:inline">
                    Procedural Forge
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Coord: ({Math.round(entity.x)}, {Math.round(entity.y)})
                {"orbitRadius" in entity &&
                  ` • Raio Central: ${Math.round((entity as Planet).orbitRadius)} AU`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-xs font-mono"
        >
          {/* =================================================================
              TOP CONTROLS: NAME & FACTION
             ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 uppercase tracking-wider mb-1 font-bold">
                Nome da Entidade
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={entityType === "planet" ? "Ex: Eos-Prime" : "Ex: 1ª Frota Orbital"}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-300 uppercase tracking-wider mb-1 font-bold">
                Facção Soberana
              </label>
              <select
                value={factionId}
                onChange={(e) => setFactionId(e.target.value as FactionId)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono cursor-pointer"
              >
                {ALL_FACTIONS_LIST.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================================
              PLANET FORGE SECTION
             ================================================================= */}
          {entityType === "planet" && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              {/* Procedural Magic Generator Bar */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-amber-950/20 border border-sky-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-slate-100 block text-xs">
                      Gerador Procedural de Atributos
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Calcula tipo, clima, recursos e traits com pesos estelares
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-300/90 hover:text-amber-200">
                    <input
                      type="checkbox"
                      checked={allowRuinsInGen}
                      onChange={(e) => setAllowRuinsInGen(e.target.checked)}
                      className="rounded accent-amber-500 w-3.5 h-3.5"
                    />
                    <span>Permitir Ruínas (5%)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleRollProcedural}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Gerar Proceduralmente</span>
                  </button>
                </div>
              </div>

              {/* 2x3 Physical Attributes Grid */}
              <div>
                <label className="block text-slate-300 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Atributos Físicos Planetários (2x3)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/30 p-3 rounded-2xl border border-white/5">
                  {/* 1. Tamanho */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Compass className="w-3 h-3 text-sky-400" />
                      Tamanho
                    </span>
                    <select
                      value={planetSize}
                      onChange={(e) => setPlanetSize(e.target.value as PlanetSize)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-sky-500 text-xs"
                    >
                      {PLANET_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Tipo */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3 text-teal-400" />
                      Tipo
                    </span>
                    <select
                      value={planetType}
                      onChange={(e) => setPlanetType(e.target.value as PlanetType)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-teal-500 text-xs"
                    >
                      {PLANET_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Temperatura */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-rose-400" />
                      Temperatura
                    </span>
                    <select
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value as PlanetTemperature)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-rose-500 text-xs"
                    >
                      {PLANET_TEMPERATURES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Atmosfera */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-cyan-400" />
                      Atmosfera
                    </span>
                    <select
                      value={atmosphere}
                      onChange={(e) => setAtmosphere(e.target.value as PlanetAtmosphere)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-cyan-500 text-xs"
                    >
                      {PLANET_ATMOSPHERES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Gravidade */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Weight className="w-3 h-3 text-indigo-400" />
                      Gravidade
                    </span>
                    <select
                      value={gravity}
                      onChange={(e) => setGravity(e.target.value as PlanetGravity)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      {PLANET_GRAVITIES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Modo Orbital */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Orbit className="w-3 h-3 text-amber-400" />
                      Modo Orbital
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const willEnable = !anomalousOrbit.enabled;
                        if (willEnable) {
                          const p = entity as Planet;
                          const rot = anomalousOrbit.rotation || 25;
                          const calibrated = calibrateAnomalousOrbitToPlanet(
                            p.x,
                            p.y,
                            0,
                            0,
                            rot,
                            0.65
                          );
                          setAnomalousOrbit(calibrated);
                        } else {
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            enabled: false,
                          });
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        anomalousOrbit.enabled
                          ? "bg-amber-400/15 text-amber-300 border-amber-400/40"
                          : "bg-black/60 text-slate-400 border-white/10"
                      }`}
                    >
                      <span>{anomalousOrbit.enabled ? "Órbita Anômala" : "Órbita Padrão"}</span>
                      <span className="text-[10px]">
                        {anomalousOrbit.enabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags de Recursos (Interactive Pills) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Depósitos de Recursos
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Clique na seta para alternar nível)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {resources.length} recurso(s) mapeado(s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-black/30 rounded-2xl border border-white/5 min-h-[50px] items-center">
                  {resources.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      Nenhum recurso cadastrado. Use o gerador ou adicione abaixo.
                    </span>
                  ) : (
                    resources.map((res) => {
                      const theme = RESOURCE_THEMES[res.name] || {
                        badgeBg: "bg-white/10",
                        borderColor: "border-white/20",
                        textColor: "text-slate-200",
                        color: "#ffffff",
                      };
                      return (
                        <div
                          key={res.name}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${theme.badgeBg} ${theme.borderColor} ${theme.textColor}`}
                        >
                          <span>{res.name}</span>
                          <button
                            type="button"
                            onClick={() => cycleResourceLevel(res.name)}
                            title={`Nível: ${res.level} • Clique para alternar`}
                            className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/60 text-amber-300 border border-white/10 text-[10px] cursor-pointer"
                          >
                            {getResourceLevelArrows(res.level)} {res.level}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeResource(res.name)}
                            title="Remover recurso"
                            className="p-0.5 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Resource Selector */}
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={resourceToAdd}
                    onChange={(e) => setResourceToAdd(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-slate-200 text-xs"
                  >
                    {ALL_PLANET_RESOURCES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddResource}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Special Traits / Neon Badges */}
              <div>
                <label className="block text-slate-300 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Características Especiais (Neon Traits)
                </label>

                <div className="flex flex-wrap gap-2">
                  {/* 1. Vida Inteligente */}
                  <button
                    type="button"
                    onClick={() => toggleTrait(SPECIAL_TRAITS.INTELLIGENT_LIFE)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      traits.includes(SPECIAL_TRAITS.INTELLIGENT_LIFE)
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50"
                        : "bg-black/30 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{SPECIAL_TRAITS.INTELLIGENT_LIFE}</span>
                  </button>

                  {/* 2. Civilização Avançada */}
                  <button
                    type="button"
                    onClick={() => toggleTrait(SPECIAL_TRAITS.ADVANCED_CIVILIZATION)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      traits.includes(SPECIAL_TRAITS.ADVANCED_CIVILIZATION)
                        ? "bg-purple-500/20 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)] ring-1 ring-purple-400/60"
                        : "bg-black/30 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-purple-300" />
                    <span>{SPECIAL_TRAITS.ADVANCED_CIVILIZATION}</span>
                  </button>

                  {/* 3. Ruínas Precursoras */}
                  <button
                    type="button"
                    onClick={() => toggleTrait(SPECIAL_TRAITS.PRECURSOR_RUINS)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      traits.includes(SPECIAL_TRAITS.PRECURSOR_RUINS)
                        ? "bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)] ring-1 ring-amber-400/70"
                        : "bg-black/30 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    <span>{SPECIAL_TRAITS.PRECURSOR_RUINS}</span>
                  </button>
                </div>
              </div>

              {/* Anomalous Orbit Config Panel */}
              {anomalousOrbit.enabled && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-400/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Orbit className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-300 text-xs">
                        Configuração da Órbita Anômala (Elipse Descentralizada)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCalibrateOrbit}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      🎯 Calibrar à posição do Planeta
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Centro X (AU)</span>
                      <input
                        type="number"
                        value={anomalousOrbit.centerX}
                        onChange={(e) =>
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            centerX: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-center font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Centro Y (AU)</span>
                      <input
                        type="number"
                        value={anomalousOrbit.centerY}
                        onChange={(e) =>
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            centerY: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-center font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Semi-Eixo X (AU)</span>
                      <input
                        type="number"
                        min="20"
                        value={anomalousOrbit.radiusX}
                        onChange={(e) =>
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            radiusX: Math.max(20, parseInt(e.target.value) || 20),
                          })
                        }
                        className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-center font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Semi-Eixo Y (AU)</span>
                      <input
                        type="number"
                        min="20"
                        value={anomalousOrbit.radiusY}
                        onChange={(e) =>
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            radiusY: Math.max(20, parseInt(e.target.value) || 20),
                          })
                        }
                        className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-center font-bold"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block mb-0.5">Rotação (°)</span>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={anomalousOrbit.rotation || 0}
                        onChange={(e) =>
                          setAnomalousOrbit({
                            ...anomalousOrbit,
                            rotation: (parseInt(e.target.value) || 0) % 360,
                          })
                        }
                        className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TROOP SPECIFIC CONTROLS
             ================================================================= */}
          {entityType === "troop" && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Orientação / Ângulo da Tropa</span>
                <span>{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          )}

          {/* Notes / Tactical description */}
          <div>
            <label className="block text-slate-300 uppercase tracking-wider mb-1 font-bold">
              Notas & Histórico de Exploração
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes sobre colônias, guarnições ou anomalias orbitais..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs font-sans resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onDelete(entity.id, entityType);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Entidade</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-300 hover:text-white text-xs rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all font-mono"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
