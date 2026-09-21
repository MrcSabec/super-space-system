"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Planet, Troop, FactionId, MapState, TroopClass, PlayerCharacter, ResourceLevel } from "@/types/sss";
import { getFaction } from "@/lib/factions";
import { FACTION_INITIAL_MILITARY_TIERS } from "@/lib/resources";
import { AlertTriangle, X, Dices, Settings, Sparkles, Wand2, Move, Compass, Orbit, Sliders, Eye, Plus } from "lucide-react";
import { MapControls, MapTool, TROOP_CLASSES } from "./MapControls";
import { EntityModal } from "./EntityModal";
import {
  getPlanetVisualRadius,
  generatePlanetStats,
  RESOURCE_THEMES,
  getResourceLevelArrows,
  SPECIAL_TRAITS,
  PLANET_SIZES,
  PLANET_TYPES,
  PLANET_TEMPERATURES,
  PLANET_ATMOSPHERES,
  PLANET_GRAVITIES,
  fitEllipseThroughPlanet,
  getPointOnAnomalousOrbit,
  getClosestPhaseOnAnomalousOrbit,
  getPointOnCircularOrbit,
  calibrateAnomalousOrbitToPlanet,
  generateAnomalousOrbit,
  ALL_PLANET_RESOURCES,
} from "@/lib/planetForge";

interface StarMapCanvasProps {
  campaignId: string;
  mapState: MapState;
  onUpdateMapState?: (newState: MapState) => Promise<void>;
  onUpdateTroops?: (troops: Troop[]) => Promise<void>;
  onUpdatePlanets?: (planets: Planet[]) => Promise<void>;
  isGM?: boolean;
  currentUser?: { id: string; username: string } | null;
  character?: PlayerCharacter | null;
  campaignFactions?: FactionId[];
  allCharacters?: PlayerCharacter[];
  onOpenEmpiresModal?: () => void;
  onOpenDiplomacyModal?: () => void;
  isLiveMode?: boolean;
  onToggleLiveMode?: () => void;
}

export const StarMapCanvas: React.FC<StarMapCanvasProps> = ({
  campaignId: _campaignId,
  mapState,
  onUpdateMapState,
  onUpdateTroops,
  onUpdatePlanets,
  isGM = false,
  currentUser,
  character,
  campaignFactions = [],
  allCharacters = [],
  onOpenEmpiresModal,
  onOpenDiplomacyModal,
  isLiveMode = true,
  onToggleLiveMode,
}) => {
  // Viewport transformation: Pan (translateX, translateY) and Zoom scale
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasMovedPan, setHasMovedPan] = useState(false);

  // Active Tool ("navigate" = pan map, "select" = select & move troops, "add_troop", "add_planet")
  const [activeTool, setActiveTool] = useState<MapTool>("select");
  const [selectedFactionForAdd, setSelectedFactionForAdd] = useState<FactionId>(
    campaignFactions?.[0] || character?.factionId || "humanos"
  );
  const [showGrid, setShowGrid] = useState(true);

  // Troop Stamp Pre-Configuration (In-Toolbox, no pop-ups)
  const [selectedTroopClass, setSelectedTroopClass] = useState<TroopClass>("light_infantry");
  const [isAirspace, setIsAirspace] = useState(false);
  const [payloadCount, setPayloadCount] = useState(0);

  // Selected Troop State (Click to select, click map to return/deselect)
  const [selectedTroop, setSelectedTroop] = useState<Troop | null>(null);

  // GM Vision Filter / Fog of War Simulator ('global' or specific FactionId)
  const [viewAs, setViewAs] = useState<"global" | FactionId>("global");

  // Drag & Drop State for Troops
  const [localTroops, setLocalTroops] = useState<Troop[]>(mapState.troops || []);
  const [draggingTroop, setDraggingTroop] = useState<{
    id: string;
    startX: number;
    startY: number;
    mouseStartWx: number;
    mouseStartWy: number;
    hasMoved: boolean;
  } | null>(null);

  // Synchronous ref to immediately prevent canvas panning while a troop is being dragged
  const isDraggingTroopRef = useRef(false);
  const hasMovedTroopRef = useRef(false);

  // Modal State for Planet Editing (GM)
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<Planet | Troop | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<"planet" | "troop">("planet");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Planet Inspector popup & resource quick-editor state
  const [inspectedPlanet, setInspectedPlanet] = useState<Planet | null>(null);
  const [isAddingResourceInInspector, setIsAddingResourceInInspector] = useState(false);
  const [newResourceName, setNewResourceName] = useState<string>(ALL_PLANET_RESOURCES[0]);

  // Drag & Drop / Translocation State for Planets (GM)
  const [localPlanets, setLocalPlanets] = useState<Planet[]>(mapState.planets || []);
  const [isTranslocatingPlanetId, setIsTranslocatingPlanetId] = useState<string | null>(null);
  const [translocationMode, setTranslocationMode] = useState<"orbit" | "free">("orbit");

  // Consolidated MapState builder to prevent stale prop overwrites between planets and troops
  const buildFullMapState = useCallback(
    (planetsOverride?: Planet[], troopsOverride?: Troop[]): MapState => ({
      ...mapState,
      planets: planetsOverride ?? localPlanets,
      troops: troopsOverride ?? localTroops,
      updatedAt: Date.now(),
    }),
    [mapState, localPlanets, localTroops]
  );

  const commitTroops = useCallback(
    (updatedTroops: Troop[]) => {
      setLocalTroops(updatedTroops);
      if (onUpdateTroops) {
        onUpdateTroops(updatedTroops);
      } else {
        onUpdateMapState?.(buildFullMapState(undefined, updatedTroops));
      }
    },
    [buildFullMapState, onUpdateTroops, onUpdateMapState]
  );

  const commitPlanets = useCallback(
    (updatedPlanets: Planet[]) => {
      setLocalPlanets(updatedPlanets);
      if (onUpdatePlanets) {
        onUpdatePlanets(updatedPlanets);
      } else {
        onUpdateMapState?.(buildFullMapState(updatedPlanets, undefined));
      }
    },
    [buildFullMapState, onUpdatePlanets, onUpdateMapState]
  );
  const [draggingPlanet, setDraggingPlanet] = useState<{
    id: string;
    startX: number;
    startY: number;
    mouseStartWx: number;
    mouseStartWy: number;
    hasMoved: boolean;
  } | null>(null);

  // Synchronous ref to immediately prevent canvas panning while a planet is being dragged
  const isDraggingPlanetRef = useRef(false);
  const hasMovedPlanetRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize local troops whenever external mapState updates (unless currently dragging)
  useEffect(() => {
    if (!draggingTroop) {
      setLocalTroops(mapState.troops || []);
    }
  }, [mapState.troops, draggingTroop]);

  // Synchronize local planets whenever external mapState updates (unless currently dragging)
  useEffect(() => {
    if (!draggingPlanet) {
      setLocalPlanets(mapState.planets || []);
    }
  }, [mapState.planets, draggingPlanet]);

  // Keep selectedTroop up to date with latest data from localTroops
  useEffect(() => {
    if (selectedTroop) {
      const fresh = localTroops.find((t) => t.id === selectedTroop.id);
      if (fresh) {
        setSelectedTroop(fresh);
      } else {
        setSelectedTroop(null);
      }
    }
  }, [localTroops]);

  // Keep inspectedPlanet up to date with latest data from localPlanets
  useEffect(() => {
    if (inspectedPlanet) {
      const fresh = localPlanets.find((p) => p.id === inspectedPlanet.id);
      if (fresh) {
        setInspectedPlanet(fresh);
      }
    }
  }, [localPlanets]);

  // In-canvas quota warning notification
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  useEffect(() => {
    if (quotaNotice) {
      const timer = setTimeout(() => setQuotaNotice(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [quotaNotice]);

  const targetFactionId = isGM
    ? selectedFactionForAdd
    : character?.factionId || "neutral";

  const targetChar =
    allCharacters.find((c) => c.factionId === targetFactionId) ||
    (character?.factionId === targetFactionId ? character : null);

  const initialMilitary =
    FACTION_INITIAL_MILITARY_TIERS[targetFactionId] ||
    FACTION_INITIAL_MILITARY_TIERS.neutral;

  const troopQuotas = useMemo<
    Record<TroopClass, { placed: number; max: number; available: number }>
  >(() => {
    if (isGM && targetFactionId === "neutral") {
      const inf = (cls: TroopClass) => ({
        placed: localTroops.filter(
          (t) => t.factionId === "neutral" && t.troopClass === cls
        ).length,
        max: 9999,
        available: 9999,
      });
      return {
        light_infantry: inf("light_infantry"),
        heavy_infantry: inf("heavy_infantry"),
        light_vehicle: inf("light_vehicle"),
        heavy_vehicle: inf("heavy_vehicle"),
        elite: inf("elite"),
      };
    }

    const calc = (
      cls: TroopClass,
      tierKey:
        | "lightInfantry"
        | "heavyInfantry"
        | "lightVehicles"
        | "heavyVehicles"
        | "eliteUnits"
    ) => {
      const max = targetChar?.[tierKey] ?? initialMilitary[tierKey] ?? 0;
      const placed = localTroops.filter(
        (t) => t.factionId === targetFactionId && t.troopClass === cls
      ).length;
      return {
        placed,
        max,
        available: Math.max(0, max - placed),
      };
    };

    return {
      light_infantry: calc("light_infantry", "lightInfantry"),
      heavy_infantry: calc("heavy_infantry", "heavyInfantry"),
      light_vehicle: calc("light_vehicle", "lightVehicles"),
      heavy_vehicle: calc("heavy_vehicle", "heavyVehicles"),
      elite: calc("elite", "eliteUnits"),
    };
  }, [localTroops, targetFactionId, targetChar, initialMilitary, isGM]);

  // Center pan on initial mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
    }
  }, []);

  // Screen to World Coordinates conversion (relative to central star 0,0)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const wx = (screenX - pan.x) / zoom;
      const wy = (screenY - pan.y) / zoom;
      return { wx, wy };
    },
    [pan, zoom]
  );

  // Helper to determine if an event target belongs to the HUD or any interactive UI overlay
  const isHudElement = (target: EventTarget | null): boolean => {
    if (!target) return false;
    if (!(target instanceof HTMLElement || target instanceof SVGElement)) return false;
    return Boolean(
      target.closest(
        '[data-hud="true"], .hud-element, button, input, select, textarea, form, dialog, [role="dialog"], .modal, .modal-backdrop'
      )
    );
  };

  // ==========================================================================
  // PANNING (Canvas drag when clicking empty space)
  // ==========================================================================
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // CRITICAL: If click originated on HUD, do not start map panning!
    if (isHudElement(e.target)) return;

    // CRITICAL: If a troop or planet is currently being dragged, never start panning!
    if (isDraggingTroopRef.current || isDraggingPlanetRef.current) return;

    setIsPanning(true);
    setHasMovedPan(false);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // CRITICAL: If a troop or planet is being dragged, map panning is strictly disabled!
    if (isDraggingTroopRef.current || isDraggingPlanetRef.current) return;
    if (!isPanning) return;

    const deltaX = Math.abs(e.clientX - (panStart.x + pan.x));
    const deltaY = Math.abs(e.clientY - (panStart.y + pan.y));
    if (deltaX > 3 || deltaY > 3) {
      setHasMovedPan(true);
    }
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom towards mouse pointer
  const handleWheel = (e: React.WheelEvent) => {
    // If scrolling over a scrollable HUD panel, let the panel scroll normally without zooming the galaxy map
    const target = e.target as HTMLElement;
    if (target?.closest?.('[data-hud="true"], .hud-element, .overflow-y-auto')) {
      return;
    }

    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 3.5);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      });
      setZoom(newZoom);
    }
  };

  // ==========================================================================
  // CANVAS CLICK (Empty map space click clears selection or stamps troop)
  // ==========================================================================
  const handleCanvasClick = (e: React.MouseEvent) => {
    // CRITICAL: Never create troops, planets or change selection when clicking ANY HUD area!
    // The user must step back / move their cursor to the open map canvas space ("recuar antes").
    if (isHudElement(e.target)) return;

    if (hasMovedPan) return; // Ignore if user was panning the map

    // OPTION 1: Return to normal map movement / deselect on clicking map background
    if (activeTool === "select" || activeTool === "navigate") {
      setSelectedTroop(null);
      setInspectedPlanet(null);
      setIsTranslocatingPlanetId(null);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { wx, wy } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (activeTool === "add_troop") {
      const targetFactionId = isGM
        ? selectedFactionForAdd
        : character?.factionId || "neutral";
      const isQuotaBypassed = isGM || targetFactionId === "neutral";

      const quota = troopQuotas[selectedTroopClass];
      const classConfig =
        TROOP_CLASSES.find((c) => c.id === selectedTroopClass) || TROOP_CLASSES[0];

      if (!isQuotaBypassed && quota && quota.placed >= quota.max) {
        setQuotaNotice(
          `Limite de mobilização atingido! Sua facção já possui ${quota.placed}/${quota.max} de ${classConfig.label} no mapa. Remova uma unidade existente do mapa para reposicioná-la.`
        );
        return;
      }

      const ownerId = isGM
        ? "dm"
        : currentUser?.id ||
          character?.userId ||
          currentUser?.username ||
          "player";

      let defaultName = `${classConfig.label} ${(localTroops.length + 1)}`;
      if (selectedTroopClass === "elite") {
        defaultName = `Elite ${isAirspace ? "Aérea" : "Terrestre"} ${(localTroops.length + 1)}`;
      }

      const isVehicleOrAir =
        selectedTroopClass === "light_vehicle" ||
        selectedTroopClass === "heavy_vehicle" ||
        (selectedTroopClass === "elite" && isAirspace);

      const visibleToList = ["Todos", "all", "dm", "neutral", targetFactionId, ownerId];

      const newTroop: Troop = {
        id: `trp_${Date.now()}_` + Math.random().toString(36).substring(2, 6),
        name: defaultName,
        x: Math.round(wx),
        y: Math.round(wy),
        factionId: targetFactionId,
        angle: 0,
        troopClass: selectedTroopClass,
        is_airspace: selectedTroopClass === "elite" ? Boolean(isAirspace) : false,
        payload: isVehicleOrAir ? payloadCount : 0,
        ownerId,
        visible_to: visibleToList,
      };

      const updatedTroops = [...localTroops, newTroop];
      commitTroops(updatedTroops);
      setSelectedTroop(newTroop);
    } else if (activeTool === "add_planet" && isGM) {
      const orbitRadius = Math.round(Math.sqrt(wx * wx + wy * wy));
      let initialPhase = Math.round((Math.atan2(wy, wx) * 180) / Math.PI);
      if (initialPhase < 0) initialPhase += 360;

      const stats = generatePlanetStats({ allowRuins: false });
      const newPlanet: Planet = {
        id: `plt_${Date.now()}_` + Math.random().toString(36).substring(2, 5),
        name: `Planeta-${(localPlanets.length || 0) + 1}`,
        x: Math.round(wx),
        y: Math.round(wy),
        orbitRadius,
        orbitalPhase: initialPhase,
        factionId: selectedFactionForAdd,
        size: stats.size,
        type: stats.type,
        temperature: stats.temperature,
        atmosphere: stats.atmosphere,
        gravity: stats.gravity,
        resources: stats.resources,
        traits: stats.traits,
        notes: "Novo sistema mapeado.",
      };

      const updatedPlanets = [...localPlanets, newPlanet];
      commitPlanets(updatedPlanets);

      setInspectedPlanet(newPlanet);
      setActiveTool("select");
    }
  };

  // ==========================================================================
  // TROOP INTERACTIONS: SIMPLE CLICK TO SELECT & DRAG TO MOVE
  // ==========================================================================
  const handleTroopClick = (e: React.MouseEvent, troop: Troop) => {
    // CRITICAL: Stop propagation so canvas background click does NOT immediately deselect it!
    e.stopPropagation();

    // If it was a drag gesture, don't re-select / toggle
    if (hasMovedTroopRef.current) return;

    // OPTION 1: Simple click selects the troop
    setSelectedTroop(troop);
    setInspectedPlanet(null);
  };

  const handleTroopPointerDown = (e: React.PointerEvent, troop: Troop) => {
    if (e.button !== 0) return;
    // CRITICAL: Stop propagation to prevent pointer bubbling
    e.stopPropagation();

    const isOwner =
      troop.ownerId &&
      (troop.ownerId === currentUser?.id ||
        troop.ownerId === character?.userId ||
        troop.ownerId === currentUser?.username);
    const isSameFaction =
      character?.factionId && troop.factionId === character.factionId;
    const canMove = isGM || isOwner || isSameFaction;

    // Always select on pointer down
    setSelectedTroop(troop);
    setInspectedPlanet(null);

    if (!canMove) return;

    // Set synchronous guard so handleMouseMove and handleMouseDown on canvas do NOT start panning!
    isDraggingTroopRef.current = true;
    hasMovedTroopRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      setDraggingTroop({
        id: troop.id,
        startX: troop.x,
        startY: troop.y,
        mouseStartWx: mouseWorld.wx,
        mouseStartWy: mouseWorld.wy,
        hasMoved: false,
      });
    }
  };

  const handleTroopPointerMove = (e: React.PointerEvent, troop: Troop) => {
    if (!draggingTroop || draggingTroop.id !== troop.id || !containerRef.current) return;
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const currentWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const deltaWx = currentWorld.wx - draggingTroop.mouseStartWx;
    const deltaWy = currentWorld.wy - draggingTroop.mouseStartWy;

    if (Math.abs(deltaWx) > 2 || Math.abs(deltaWy) > 2) {
      hasMovedTroopRef.current = true;
      if (!draggingTroop.hasMoved) {
        setDraggingTroop((prev) => (prev ? { ...prev, hasMoved: true } : null));
      }
    }

    const newX = Math.round(draggingTroop.startX + deltaWx);
    const newY = Math.round(draggingTroop.startY + deltaWy);

    // Smooth local 60 FPS update of troop coordinates
    setLocalTroops((prev) =>
      prev.map((t) => (t.id === troop.id ? { ...t, x: newX, y: newY } : t))
    );
  };

  const handleTroopPointerUp = (e: React.PointerEvent, troop: Troop) => {
    if (!draggingTroop || draggingTroop.id !== troop.id) return;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Reset synchronous dragging flag
    isDraggingTroopRef.current = false;

    if (draggingTroop.hasMoved) {
      // Save final coordinates to Firestore / server store ONLY on pointerUp
      const currentFinalTroop = localTroops.find((t) => t.id === troop.id);
      if (currentFinalTroop) {
        const updatedTroops = localTroops.map((t) =>
          t.id === troop.id ? currentFinalTroop : t
        );
        commitTroops(updatedTroops);
      }
    }

    setDraggingTroop(null);
  };

  // ==========================================================================
  // TROOP VISIBILITY & PAYLOAD UPDATES
  // ==========================================================================
  const handleUpdateSelectedTroop = (updated: Troop) => {
    const updatedTroops = localTroops.map((t) => (t.id === updated.id ? updated : t));
    commitTroops(updatedTroops);
    setSelectedTroop(updated);
  };

  const handleDeleteTroop = (id: string) => {
    const updatedTroops = localTroops.filter((t) => t.id !== id);
    commitTroops(updatedTroops);
    setSelectedTroop(null);
  };

  // Keyboard shortcut: Delete or Backspace removes the currently selected troop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTroop) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteTroop(selectedTroop.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTroop, localTroops, mapState, onUpdateMapState]);

  // ==========================================================================
  // PLANET INTERACTIONS & TRANSLOCATION SYSTEM
  // ==========================================================================
  const handlePlanetClick = (e: React.MouseEvent, planet: Planet) => {
    e.stopPropagation();
    if (hasMovedPlanetRef.current) return;
    setSelectedTroop(null);
    setInspectedPlanet(planet);
  };

  const handlePlanetPointerDown = (e: React.PointerEvent, planet: Planet) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    setSelectedTroop(null);
    setInspectedPlanet(planet);

    // Only GM can drag / translocate planets
    if (!isGM) return;

    isDraggingPlanetRef.current = true;
    hasMovedPlanetRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      setDraggingPlanet({
        id: planet.id,
        startX: planet.x,
        startY: planet.y,
        mouseStartWx: mouseWorld.wx,
        mouseStartWy: mouseWorld.wy,
        hasMoved: false,
      });
    }
  };

  const handlePlanetPointerMove = (e: React.PointerEvent, planet: Planet) => {
    if (!draggingPlanet || draggingPlanet.id !== planet.id || !containerRef.current) return;
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const currentWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const deltaWx = currentWorld.wx - draggingPlanet.mouseStartWx;
    const deltaWy = currentWorld.wy - draggingPlanet.mouseStartWy;

    if (Math.abs(deltaWx) > 2 || Math.abs(deltaWy) > 2) {
      hasMovedPlanetRef.current = true;
      if (!draggingPlanet.hasMoved) {
        setDraggingPlanet((prev) => (prev ? { ...prev, hasMoved: true } : null));
      }
    }

    let updatedPlanet: Planet;

    if (translocationMode === "orbit") {
      // Strictly glide along the dashed orbit line!
      if (planet.anomalousOrbit?.enabled) {
        const phaseDeg = getClosestPhaseOnAnomalousOrbit(
          planet.anomalousOrbit,
          currentWorld.wx,
          currentWorld.wy
        );
        const pos = getPointOnAnomalousOrbit(planet.anomalousOrbit, phaseDeg);
        updatedPlanet = {
          ...planet,
          x: pos.x,
          y: pos.y,
          orbitalPhase: phaseDeg,
          anomalousOrbit: {
            ...planet.anomalousOrbit,
            orbitalPhase: phaseDeg,
          },
        };
      } else {
        const baseRadius = planet.orbitRadius || Math.round(Math.hypot(planet.x, planet.y)) || 100;
        let phaseDeg = Math.round((Math.atan2(currentWorld.wy, currentWorld.wx) * 180) / Math.PI);
        if (phaseDeg < 0) phaseDeg += 360;
        const pos = getPointOnCircularOrbit(baseRadius, phaseDeg);
        updatedPlanet = {
          ...planet,
          x: pos.x,
          y: pos.y,
          orbitRadius: baseRadius,
          orbitalPhase: phaseDeg,
        };
      }
    } else {
      // Free translocation mode: move anywhere on map, orbit recalibrates to accompany planet
      const newX = Math.round(draggingPlanet.startX + deltaWx);
      const newY = Math.round(draggingPlanet.startY + deltaWy);

      if (planet.anomalousOrbit?.enabled) {
        const calibrated = calibrateAnomalousOrbitToPlanet(
          newX,
          newY,
          0,
          0,
          planet.anomalousOrbit.rotation || 0,
          0.65
        );
        updatedPlanet = {
          ...planet,
          x: newX,
          y: newY,
          orbitalPhase: calibrated.orbitalPhase,
          anomalousOrbit: calibrated,
        };
      } else {
        const newRadius = Math.round(Math.hypot(newX, newY));
        let phaseDeg = Math.round((Math.atan2(newY, newX) * 180) / Math.PI);
        if (phaseDeg < 0) phaseDeg += 360;
        updatedPlanet = {
          ...planet,
          x: newX,
          y: newY,
          orbitRadius: newRadius,
          orbitalPhase: phaseDeg,
        };
      }
    }

    setLocalPlanets((prev) =>
      prev.map((p) => (p.id === planet.id ? updatedPlanet : p))
    );
  };

  const handlePlanetPointerUp = (e: React.PointerEvent, planet: Planet) => {
    if (!draggingPlanet || draggingPlanet.id !== planet.id) return;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isDraggingPlanetRef.current = false;

    if (draggingPlanet.hasMoved || hasMovedPlanetRef.current) {
      const finalPlanet = localPlanets.find((p) => p.id === planet.id);
      if (finalPlanet) {
        const updatedPlanets = localPlanets.map((p) =>
          p.id === planet.id ? finalPlanet : p
        );
        commitPlanets(updatedPlanets);
      }
    }

    setDraggingPlanet(null);
  };

  const handleSetPlanetPhase = (planet: Planet, phaseDeg: number) => {
    const normalizedPhase = ((phaseDeg % 360) + 360) % 360;
    let updatedPlanet: Planet;

    if (planet.anomalousOrbit?.enabled) {
      const pos = getPointOnAnomalousOrbit(planet.anomalousOrbit, normalizedPhase);
      updatedPlanet = {
        ...planet,
        x: pos.x,
        y: pos.y,
        orbitalPhase: normalizedPhase,
        anomalousOrbit: {
          ...planet.anomalousOrbit,
          orbitalPhase: normalizedPhase,
        },
      };
    } else {
      const radius = planet.orbitRadius || Math.round(Math.hypot(planet.x, planet.y)) || 100;
      const pos = getPointOnCircularOrbit(radius, normalizedPhase);
      updatedPlanet = {
        ...planet,
        x: pos.x,
        y: pos.y,
        orbitRadius: radius,
        orbitalPhase: normalizedPhase,
      };
    }

    setInspectedPlanet(updatedPlanet);

    const updatedPlanets = localPlanets.map((p) =>
      p.id === planet.id ? updatedPlanet : p
    );
    commitPlanets(updatedPlanets);
  };

  const handleStepPlanetPhase = (planet: Planet, step: number) => {
    let currentPhase = planet.orbitalPhase;
    if (typeof currentPhase !== "number") {
      if (planet.anomalousOrbit?.enabled) {
        currentPhase = getClosestPhaseOnAnomalousOrbit(planet.anomalousOrbit, planet.x, planet.y);
      } else {
        currentPhase = Math.round((Math.atan2(planet.y, planet.x) * 180) / Math.PI);
        if (currentPhase < 0) currentPhase += 360;
      }
    }
    handleSetPlanetPhase(planet, currentPhase + step);
  };

  const handleToggleAnomalousOrbit = (planet: Planet) => {
    let updatedPlanet: Planet;
    if (planet.anomalousOrbit?.enabled) {
      // Switch back to standard concentric orbit
      const orbitRadius = Math.round(Math.hypot(planet.x, planet.y)) || 150;
      let phaseDeg = Math.round((Math.atan2(planet.y, planet.x) * 180) / Math.PI);
      if (phaseDeg < 0) phaseDeg += 360;
      updatedPlanet = {
        ...planet,
        orbitRadius,
        orbitalPhase: phaseDeg,
        anomalousOrbit: {
          ...planet.anomalousOrbit,
          enabled: false,
        },
      };
    } else {
      // Switch to anomalous orbit - centered on the system's sun (0, 0) and calibrated to planet coordinates!
      const rot = 25;
      const calibrated = calibrateAnomalousOrbitToPlanet(planet.x, planet.y, 0, 0, rot, 0.65);
      updatedPlanet = {
        ...planet,
        anomalousOrbit: calibrated,
        orbitalPhase: calibrated.orbitalPhase,
      };
    }

    setInspectedPlanet(updatedPlanet);

    const updatedPlanets = localPlanets.map((p) =>
      p.id === planet.id ? updatedPlanet : p
    );
    commitPlanets(updatedPlanets);
  };

  const handleRollPlanetInInspector = (planet: Planet) => {
    const currentHasRuins = Boolean(
      planet.traits &&
      planet.traits.some((t) => typeof t === "string" && t.trim() === SPECIAL_TRAITS.PRECURSOR_RUINS)
    );
    const stats = generatePlanetStats({ allowRuins: currentHasRuins });
    const updatedPlanet: Planet = {
      ...planet,
      size: stats.size,
      type: stats.type,
      temperature: stats.temperature,
      atmosphere: stats.atmosphere,
      gravity: stats.gravity,
      resources: stats.resources,
      traits: stats.traits,
    };
    setInspectedPlanet(updatedPlanet);
    const updatedPlanets = localPlanets.map((p) =>
      p.id === planet.id ? updatedPlanet : p
    );
    commitPlanets(updatedPlanets);
  };

  const handleUpdatePlanetField = (planet: Planet, field: Partial<Planet>) => {
    const updatedPlanet: Planet = {
      ...planet,
      ...field,
    };
    setInspectedPlanet(updatedPlanet);
    const updatedPlanets = localPlanets.map((p) =>
      p.id === planet.id ? updatedPlanet : p
    );
    commitPlanets(updatedPlanets);
  };

  const handleCyclePlanetResourceLevel = (planet: Planet, resourceName: string) => {
    const nextLevels: Record<ResourceLevel, ResourceLevel> = {
      Baixa: "Média",
      Média: "Alta",
      Alta: "Baixa",
    };
    const currentResources = planet.resources || [];
    const updatedResources = currentResources.map((r) =>
      r.name === resourceName ? { ...r, level: nextLevels[r.level] || "Média" } : r
    );
    handleUpdatePlanetField(planet, { resources: updatedResources });
  };

  const handleRemovePlanetResource = (planet: Planet, resourceName: string) => {
    const currentResources = planet.resources || [];
    const updatedResources = currentResources.filter((r) => r.name !== resourceName);
    handleUpdatePlanetField(planet, { resources: updatedResources });
  };

  const handleAddPlanetResource = (planet: Planet, resourceName: string) => {
    const currentResources = planet.resources || [];
    if (currentResources.some((r) => r.name === resourceName)) return;
    const updatedResources = [
      ...currentResources,
      { name: resourceName, level: "Média" as ResourceLevel },
    ];
    handleUpdatePlanetField(planet, { resources: updatedResources });
    setIsAddingResourceInInspector(false);
  };

  const handleSaveModalEntity = (updated: Planet | Troop) => {
    if (selectedEntityType === "planet") {
      const updatedPlanet = updated as Planet;
      const updatedPlanets = localPlanets.map((p) =>
        p.id === updated.id ? updatedPlanet : p
      );
      commitPlanets(updatedPlanets);
      if (inspectedPlanet?.id === updated.id) {
        setInspectedPlanet(updatedPlanet);
      }
    }
  };

  const handleDeleteModalEntity = (id: string, type: "planet" | "troop") => {
    if (type === "planet") {
      const filtered = localPlanets.filter((p) => p.id !== id);
      commitPlanets(filtered);
      if (inspectedPlanet?.id === id) {
        setInspectedPlanet(null);
      }
    }
  };

  // Navigation button handlers
  const zoomIn = () => setZoom((z) => Math.min(z * 1.25, 3.5));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.25));
  const resetView = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
      setZoom(1);
    }
  };

  // Fog of War evaluation
  const isTroopVisible = useCallback(
    (troop: Troop): boolean => {
      if (isGM) {
        if (viewAs === "global") return true;

        // GM Vision Filter (Fog of War Simulator for a specific faction)
        if (troop.factionId === viewAs || troop.ownerId === viewAs) {
          return true;
        }
        const list = (troop.visible_to && troop.visible_to.length > 0)
          ? troop.visible_to.map((v) => v.toString().toLowerCase())
          : ["todos", "all"];
        return list.some(
          (v) =>
            v === "todos" ||
            v === "all" ||
            v === viewAs.toLowerCase()
        );
      }

      // PLAYER Fog of War Filter
      const troopOwner = ((troop as any).owner || troop.ownerId || "").toString().toLowerCase();
      const currentUserId = (currentUser?.id || "").toString().toLowerCase();
      const characterUserId = (character?.userId || "").toString().toLowerCase();
      const currentUsername = (currentUser?.username || "").toString().toLowerCase();
      const playerFaction = (character?.factionId || "").toString().toLowerCase();
      const troopFaction = (troop.factionId || "").toString().toLowerCase();

      // 1. Own troop or same faction: ALWAYS VISIBLE
      if (
        (currentUserId && troopOwner === currentUserId) ||
        (characterUserId && troopOwner === characterUserId) ||
        (currentUsername && troopOwner === currentUsername)
      ) {
        return true;
      }
      if (playerFaction && troopFaction === playerFaction) {
        return true;
      }

      // 2. Default to PUBLIC if visible_to is omitted or empty
      if (!troop.visible_to || troop.visible_to.length === 0) {
        return true;
      }

      const list = troop.visible_to.map((v) => v.toString().toLowerCase());

      // 3. If explicitly marked hidden and not owner/faction:
      if (list.includes("hidden") || list.includes("oculta")) {
        return false;
      }

      // 4. Default: Unless explicitly marked hidden, troops are visible on the tactical star map!
      return true;
    },
    [isGM, viewAs, currentUser, character]
  );

  // Automatically deselect troop if it becomes hidden by vision filter
  useEffect(() => {
    if (selectedTroop && isGM && viewAs !== "global" && !isTroopVisible(selectedTroop)) {
      setSelectedTroop(null);
    }
  }, [viewAs, isGM, selectedTroop, isTroopVisible]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      className={`relative w-full h-full bg-[#08090C] overflow-hidden select-none cursor-${
        isPanning
          ? "grabbing"
          : activeTool === "add_troop"
          ? "crosshair"
          : activeTool === "select"
          ? "default"
          : "grab"
      }`}
    >
      {/* Fog of War Vignette Overlay when GM Vision is filtered */}
      {isGM && viewAs !== "global" && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 shadow-[inset_0_0_140px_rgba(0,0,0,0.88)] ring-1 ring-inset ring-amber-500/20"
        />
      )}

      {/* Top Banner when GM Vision is filtered */}
      {isGM && viewAs !== "global" && (
        <div
          data-hud="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`hud-element absolute ${
            quotaNotice ? "top-16" : "top-4"
          } left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0A0D14]/90 border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 cursor-default`}
          style={{
            borderColor: `${getFaction(viewAs).color}80`,
            boxShadow: `0 0 25px ${getFaction(viewAs).color}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: getFaction(viewAs).color }}
            />
            <Eye
              className="w-4 h-4"
              style={{ color: getFaction(viewAs).color }}
            />
            <span
              className="font-mono text-xs font-bold uppercase tracking-wider"
              style={{ color: getFaction(viewAs).color }}
            >
              MODO DE VISÃO: {getFaction(viewAs).name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
              FOG OF WAR ATIVO
            </span>
          </div>
          <button
            type="button"
            onClick={() => setViewAs("global")}
            className="ml-2 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Restaurar visão completa de Mestre"
          >
            <span>Restaurar Visão Global</span>
            <span>👁️</span>
          </button>
        </div>
      )}

      {/* In-Canvas Mobilization Quota Warning Toast */}
      {quotaNotice && (
        <div
          data-hud="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="hud-element absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#0E1118]/95 border border-rose-500/50 shadow-2xl shadow-rose-950/60 text-white px-4 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 max-w-lg cursor-default"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
          <span className="text-xs font-mono font-medium text-rose-200">
            {quotaNotice}
          </span>
          <button
            type="button"
            onClick={() => setQuotaNotice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Toolbox & Fog of War Manager */}
      <MapControls
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        selectedFactionForAdd={selectedFactionForAdd}
        onSelectFactionForAdd={setSelectedFactionForAdd}
        selectedTroopClass={selectedTroopClass}
        onSelectTroopClass={setSelectedTroopClass}
        isAirspace={isAirspace}
        onToggleAirspace={setIsAirspace}
        payloadCount={payloadCount}
        onChangePayloadCount={setPayloadCount}
        troopQuotas={troopQuotas}
        factionTroopFlavors={initialMilitary.flavor}
        selectedTroop={selectedTroop}
        onUpdateSelectedTroop={handleUpdateSelectedTroop}
        onDeleteSelectedTroop={handleDeleteTroop}
        onDeselectTroop={() => setSelectedTroop(null)}
        campaignFactions={campaignFactions}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        zoomLevel={zoom}
        isGM={isGM}
        currentUserFactionId={character?.factionId}
        isLiveMode={isLiveMode}
        onToggleLiveMode={onToggleLiveMode}
        onOpenEmpiresModal={onOpenEmpiresModal}
        onOpenDiplomacyModal={onOpenDiplomacyModal}
        viewAs={viewAs}
        onChangeViewAs={setViewAs}
      />

      {/* Main SVG Tactical Canvas */}
      <svg className="w-full h-full block" style={{ touchAction: "none" }}>
        <defs>
          <radialGradient id="centralStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF2A3" stopOpacity="1" />
            <stop offset="25%" stopColor="#FDD663" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FCAD70" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FCAD70" stopOpacity="0" />
          </radialGradient>

          <filter id="starBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>

          <pattern id="spaceGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="0.75"
            />
            <circle cx="0" cy="0" r="1.2" fill="rgba(255, 255, 255, 0.15)" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Coordinate Grid */}
          {showGrid && (
            <>
              <rect
                x="-4000"
                y="-4000"
                width="8000"
                height="8000"
                fill="url(#spaceGrid)"
              />
              <line
                x1="-3000"
                y1="0"
                x2="3000"
                y2="0"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="0"
                y1="-3000"
                x2="0"
                y2="3000"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </>
          )}

          {/* 2. Concentric & Anomalous Orbits */}
          {(localPlanets || []).map((planet) => {
            if (planet.anomalousOrbit?.enabled) {
              const { centerX, centerY, radiusX, radiusY, rotation = 0 } = planet.anomalousOrbit;
              return (
                <g key={`orbit-${planet.id}`}>
                  <ellipse
                    cx={centerX}
                    cy={centerY}
                    rx={radiusX}
                    ry={radiusY}
                    transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
                    fill="none"
                    stroke="rgba(251, 146, 60, 0.45)"
                    strokeWidth={1.2 / zoom}
                    strokeDasharray="6 6"
                    className="pointer-events-none"
                  />
                  <ellipse
                    cx={centerX}
                    cy={centerY}
                    rx={radiusX}
                    ry={radiusY}
                    transform={rotation ? `rotate(${rotation}, ${centerX}, ${centerY})` : undefined}
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.15)"
                    strokeWidth={3 / zoom}
                    className="pointer-events-none"
                  />
                  <text
                    x={centerX + radiusX + 4}
                    y={centerY - 4}
                    fill="rgba(251, 146, 60, 0.75)"
                    fontSize={8.5 / zoom}
                    fontFamily="monospace"
                    className="pointer-events-none select-none font-bold"
                  >
                    ÓRBITA ANÔMALA ({Math.round(radiusX)}x{Math.round(radiusY)} AU)
                  </text>
                </g>
              );
            }

            return (
              <g key={`orbit-${planet.id}`}>
                <circle
                  cx={0}
                  cy={0}
                  r={planet.orbitRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.16)"
                  strokeWidth={1 / zoom}
                  strokeDasharray="4 8"
                  className="transition-colors duration-300 pointer-events-none"
                />
                <text
                  x={planet.orbitRadius + 4}
                  y={-4}
                  fill="rgba(255, 255, 255, 0.25)"
                  fontSize={9 / zoom}
                  fontFamily="monospace"
                  className="pointer-events-none select-none"
                >
                  {Math.round(planet.orbitRadius)} AU
                </text>
              </g>
            );
          })}

          {/* 3. Central Star (0, 0) */}
          <g className="select-none pointer-events-none">
            <circle cx={0} cy={0} r={72} fill="url(#centralStarGlow)" opacity="0.3" />
            <circle cx={0} cy={0} r={46} fill="url(#centralStarGlow)" opacity="0.6" />
            <circle cx={0} cy={0} r={24} fill="#FFFDF0" filter="url(#starBloom)" opacity="0.9" />
            <circle cx={0} cy={0} r={20} fill="#FFF9D2" />
            <text
              x={0}
              y={38}
              textAnchor="middle"
              fill="#FDD663"
              fontSize={10 / zoom}
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.15em"
              opacity="0.8"
            >
              SOLAR-CORE (0, 0)
            </text>
          </g>

          {/* 4. Planetary Bodies */}
          {(localPlanets || []).map((planet) => {
            const faction = getFaction(planet.factionId);
            const size = getPlanetVisualRadius(planet.size);
            const hasIntelligentLife =
              planet.traits?.includes(SPECIAL_TRAITS.INTELLIGENT_LIFE) ||
              planet.traits?.includes(SPECIAL_TRAITS.ADVANCED_CIVILIZATION);
            const hasRuins = Boolean(
              planet.traits &&
              Array.isArray(planet.traits) &&
              planet.traits.some(
                (t) => typeof t === "string" && t.trim() === SPECIAL_TRAITS.PRECURSOR_RUINS
              )
            );
            return (
              <g
                key={planet.id}
                onClick={(e) => handlePlanetClick(e, planet)}
                onPointerDown={(e) => handlePlanetPointerDown(e, planet)}
                onPointerMove={(e) => handlePlanetPointerMove(e, planet)}
                onPointerUp={(e) => handlePlanetPointerUp(e, planet)}
                className={`${
                  isTranslocatingPlanetId === planet.id
                    ? "cursor-grab active:cursor-grabbing"
                    : isGM
                    ? "cursor-pointer"
                    : "cursor-pointer"
                } group select-none`}
                transform={`translate(${planet.x}, ${planet.y})`}
              >
                <line
                  x1={-planet.x}
                  y1={-planet.y}
                  x2={0}
                  y2={0}
                  stroke={faction.color}
                  strokeWidth={0.8 / zoom}
                  strokeDasharray="2 4"
                  opacity="0.2"
                  className="pointer-events-none"
                />

                {/* Special Translocation Reticle when Active */}
                {isTranslocatingPlanetId === planet.id && (
                  <g className="pointer-events-none">
                    <circle
                      cx={0}
                      cy={0}
                      r={size + 14}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1.6 / zoom}
                      strokeDasharray="4 4"
                      opacity="0.9"
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r={size + 20}
                      fill="rgba(56, 189, 248, 0.08)"
                      stroke="#0284c7"
                      strokeWidth={0.8 / zoom}
                      strokeDasharray="2 6"
                    />
                    {/* Crosshair target lines */}
                    <line x1={0} y1={-(size + 22)} x2={0} y2={-(size + 14)} stroke="#38bdf8" strokeWidth={1.5 / zoom} />
                    <line x1={0} y1={(size + 14)} x2={0} y2={(size + 22)} stroke="#38bdf8" strokeWidth={1.5 / zoom} />
                    <line x1={-(size + 22)} y1={0} x2={-(size + 14)} y2={0} stroke="#38bdf8" strokeWidth={1.5 / zoom} />
                    <line x1={(size + 14)} y1={0} x2={(size + 22)} y2={0} stroke="#38bdf8" strokeWidth={1.5 / zoom} />

                    {/* Badge tag */}
                    <g transform={`translate(0, ${-(size + 26 / zoom)})`}>
                      <rect
                        x={-45 / zoom}
                        y={-7 / zoom}
                        width={90 / zoom}
                        height={14 / zoom}
                        rx={3 / zoom}
                        fill="#0369a1"
                        stroke="#7dd3fc"
                        strokeWidth={0.8 / zoom}
                      />
                      <text
                        x={0}
                        y={3 / zoom}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={7.5 / zoom}
                        fontWeight="bold"
                        fontFamily="monospace"
                        letterSpacing="0.05em"
                      >
                        TRANSLOCANDO
                      </text>
                    </g>
                  </g>
                )}

                {/* Special Traits Visual Auras */}
                {hasIntelligentLife && (
                  <circle
                    cx={0}
                    cy={0}
                    r={size + 8}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={1.5 / zoom}
                    strokeDasharray="3 3"
                    opacity="0.65"
                    className="pointer-events-none"
                  />
                )}

                {hasRuins && (
                  <circle
                    cx={0}
                    cy={0}
                    r={size + 13}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={1.5 / zoom}
                    opacity="0.75"
                    className="pointer-events-none"
                  />
                )}

                {/* GM Vision Filter Ownership Pulsing Aura on Planet */}
                {isGM && viewAs !== "global" && planet.factionId === viewAs && (
                  <circle
                    cx={0}
                    cy={0}
                    r={size + 10}
                    fill="none"
                    stroke={faction.color}
                    strokeWidth={2 / zoom}
                    strokeDasharray="4 2"
                    className="animate-pulse pointer-events-none"
                    opacity="0.9"
                  />
                )}

                <circle
                  cx={0}
                  cy={0}
                  r={size + 6}
                  fill="none"
                  stroke={faction.color}
                  strokeWidth={1.5 / zoom}
                  opacity="0.35"
                  className="transition-all duration-200 group-hover:scale-125 group-hover:opacity-75"
                />

                <circle
                  cx={0}
                  cy={0}
                  r={size}
                  fill={faction.color}
                  className="transition-transform duration-200 group-hover:scale-110 drop-shadow-md"
                />

                <circle
                  cx={-size * 0.25}
                  cy={-size * 0.25}
                  r={size * 0.55}
                  fill="rgba(255, 255, 255, 0.25)"
                />

                <g transform={`translate(0, ${size + 14 / zoom})`} className="pointer-events-none">
                  <rect
                    x={-(planet.name.length * 4.2 + 8) / zoom}
                    y={-10 / zoom}
                    width={(planet.name.length * 8.4 + 16) / zoom}
                    height={15 / zoom}
                    rx={3 / zoom}
                    fill="rgba(10, 13, 20, 0.85)"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={0.7 / zoom}
                  />
                  <text
                    x={0}
                    y={1 / zoom}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize={9.5 / zoom}
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {planet.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* =================================================================
              5. MILITARY TROOPS: GEOMETRIC RENDERING BY CLASS & DRAG & DROP
             ================================================================= */}
          {localTroops.map((troop) => {
            if (!isTroopVisible(troop)) return null;

            const faction = getFaction(troop.factionId);
            const angle = troop.angle || 0;
            const troopClass: TroopClass = troop.troopClass || "light_vehicle";
            const isSelected = selectedTroop?.id === troop.id;
            const isDraggingThis = draggingTroop?.id === troop.id;
            const isConcealed = Boolean(
              troop.visible_to &&
              troop.visible_to.length > 0 &&
              troop.visible_to.some((v) => v.toLowerCase() === "hidden" || v.toLowerCase() === "oculta")
            );
            const payload = troop.payload || 0;

            return (
              <g
                key={troop.id}
                transform={`translate(${troop.x}, ${troop.y}) rotate(${angle})`}
                onMouseDown={(e) => {
                  // CRITICAL: Stop propagation so canvas container handleMouseDown does NOT start map pan!
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleTroopPointerDown(e, troop);
                }}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  handleTroopPointerMove(e, troop);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  handleTroopPointerUp(e, troop);
                }}
                onClick={(e) => {
                  // CRITICAL: Stop propagation so canvas container handleCanvasClick does NOT deselect the troop!
                  e.stopPropagation();
                  handleTroopClick(e, troop);
                }}
                className={`cursor-move group ${
                  isDraggingThis ? "opacity-90 scale-110" : ""
                }`}
                style={{ touchAction: "none" }}
              >
                <title>
                  {`${troop.name} • ${faction.name}${
                    payload > 0 ? ` (Embarcados: ${payload})` : ""
                  }${isConcealed ? " [Oculta / FOW]" : ""}`}
                </title>

                {/* GM Vision Filter Ownership Pulsing Aura */}
                {isGM && viewAs !== "global" && (troop.factionId === viewAs || troop.ownerId === viewAs) && (
                  <circle
                    cx={0}
                    cy={0}
                    r={troopClass === "elite" ? 28 : 20}
                    fill="none"
                    stroke={faction.color}
                    strokeWidth={2 / zoom}
                    strokeDasharray="4 3"
                    className="animate-pulse pointer-events-none"
                    opacity="0.85"
                  />
                )}

                {/* Fog of War Stealth Indicator (Dotted aura) */}
                {isConcealed && (
                  <circle
                    cx={0}
                    cy={0}
                    r={troopClass === "elite" ? 22 : 15}
                    fill="none"
                    stroke={faction.color}
                    strokeDasharray="2 3"
                    strokeWidth={1 / zoom}
                    opacity="0.6"
                    className="animate-spin-slow pointer-events-none"
                  />
                )}

                {/* Selection Highlight Brackets / Rings */}
                {isSelected && (
                  <g className="pointer-events-none">
                    <circle
                      cx={0}
                      cy={0}
                      r={troopClass === "elite" ? 26 : 18}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1.8 / zoom}
                      strokeDasharray="4 2"
                      opacity="0.9"
                      className="animate-spin-slow"
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r={troopClass === "elite" ? 28 : 20}
                      fill="none"
                      stroke={faction.color}
                      strokeWidth={1 / zoom}
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* -------------------------------------------------------------
                    GEOMETRIC SHAPE 1: INFANTARIA LEVE (QUADRADO PEQUENO 14x14)
                   ------------------------------------------------------------- */}
                {troopClass === "light_infantry" && (
                  <>
                    <rect
                      x={-7}
                      y={-7}
                      width={14}
                      height={14}
                      rx={2}
                      fill="none"
                      stroke={faction.color}
                      strokeWidth={3 / zoom}
                      opacity="0.3"
                      className="group-hover:opacity-75 transition-opacity"
                    />
                    <rect
                      x={-7}
                      y={-7}
                      width={14}
                      height={14}
                      rx={2}
                      fill={faction.color}
                      stroke="#08090C"
                      strokeWidth={1.2 / zoom}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <circle cx={0} cy={0} r={2} fill="#08090C" opacity="0.75" />
                  </>
                )}

                {/* -------------------------------------------------------------
                    GEOMETRIC SHAPE 2: INFANTARIA PESADA (QUADRADO MÉDIO 20x20)
                   ------------------------------------------------------------- */}
                {troopClass === "heavy_infantry" && (
                  <>
                    <rect
                      x={-10}
                      y={-10}
                      width={20}
                      height={20}
                      rx={3}
                      fill="none"
                      stroke={faction.color}
                      strokeWidth={3.5 / zoom}
                      opacity="0.3"
                      className="group-hover:opacity-75 transition-opacity"
                    />
                    <rect
                      x={-10}
                      y={-10}
                      width={20}
                      height={20}
                      rx={3}
                      fill={faction.color}
                      stroke="#08090C"
                      strokeWidth={1.4 / zoom}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <rect
                      x={-5}
                      y={-5}
                      width={10}
                      height={10}
                      rx={1.5}
                      fill="none"
                      stroke="#08090C"
                      strokeWidth={1 / zoom}
                      opacity="0.8"
                    />
                  </>
                )}

                {/* -------------------------------------------------------------
                    GEOMETRIC SHAPE 3: VEÍCULOS LEVES (TRIÂNGULO PEQUENO)
                   ------------------------------------------------------------- */}
                {troopClass === "light_vehicle" && (
                  <>
                    <polygon
                      points="0,-9 8,8 -8,8"
                      fill="none"
                      stroke={faction.color}
                      strokeWidth={3 / zoom}
                      opacity="0.35"
                      className="group-hover:opacity-75 transition-opacity"
                    />
                    <polygon
                      points="0,-9 8,8 -8,8"
                      fill={faction.color}
                      stroke="#08090C"
                      strokeWidth={1.2 / zoom}
                      className="group-hover:scale-110 transition-transform"
                    />
                    {payload > 0 ? (
                      <text
                        x={0}
                        y={5}
                        textAnchor="middle"
                        fill="#08090C"
                        fontSize={8.5}
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                      >
                        {payload}
                      </text>
                    ) : (
                      <polyline
                        points="-3,4 0,0 3,4"
                        fill="none"
                        stroke="#08090C"
                        strokeWidth={1 / zoom}
                        opacity="0.8"
                      />
                    )}
                  </>
                )}

                {/* -------------------------------------------------------------
                    GEOMETRIC SHAPE 4: VEÍCULOS PESADOS (TRIÂNGULO MÉDIO)
                   ------------------------------------------------------------- */}
                {troopClass === "heavy_vehicle" && (
                  <>
                    <polygon
                      points="0,-13 12,11 -12,11"
                      fill="none"
                      stroke={faction.color}
                      strokeWidth={3.5 / zoom}
                      opacity="0.35"
                      className="group-hover:opacity-75 transition-opacity"
                    />
                    <polygon
                      points="0,-13 12,11 -12,11"
                      fill={faction.color}
                      stroke="#08090C"
                      strokeWidth={1.5 / zoom}
                      className="group-hover:scale-110 transition-transform"
                    />
                    {payload > 0 ? (
                      <text
                        x={0}
                        y={6}
                        textAnchor="middle"
                        fill="#08090C"
                        fontSize={9.5}
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                      >
                        {payload}
                      </text>
                    ) : (
                      <polyline
                        points="-5,6 0,-1 5,6"
                        fill="none"
                        stroke="#08090C"
                        strokeWidth={1.2 / zoom}
                        opacity="0.8"
                      />
                    )}
                  </>
                )}

                {/* -------------------------------------------------------------
                    GEOMETRIC SHAPE 5: UNIDADES DE ELITE (FORMA GRANDE - 32px)
                   ------------------------------------------------------------- */}
                {troopClass === "elite" && (
                  <>
                    {troop.is_airspace ? (
                      <>
                        <polygon
                          points="0,-18 16,14 -16,14"
                          fill="none"
                          stroke={faction.color}
                          strokeWidth={4 / zoom}
                          opacity="0.4"
                          className="group-hover:opacity-85 transition-opacity"
                        />
                        <polygon
                          points="0,-18 16,14 -16,14"
                          fill={faction.color}
                          stroke="#08090C"
                          strokeWidth={1.8 / zoom}
                          className="group-hover:scale-110 transition-transform"
                        />
                        {payload > 0 ? (
                          <text
                            x={0}
                            y={8}
                            textAnchor="middle"
                            fill="#08090C"
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight="bold"
                            className="select-none pointer-events-none"
                          >
                            {payload}
                          </text>
                        ) : (
                          <polygon
                            points="0,-6 6,7 -6,7"
                            fill="none"
                            stroke="#08090C"
                            strokeWidth={1.2 / zoom}
                            opacity="0.85"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <rect
                          x={-15}
                          y={-15}
                          width={30}
                          height={30}
                          rx={4}
                          fill="none"
                          stroke={faction.color}
                          strokeWidth={4 / zoom}
                          opacity="0.4"
                          className="group-hover:opacity-85 transition-opacity"
                        />
                        <rect
                          x={-15}
                          y={-15}
                          width={30}
                          height={30}
                          rx={4}
                          fill={faction.color}
                          stroke="#08090C"
                          strokeWidth={1.8 / zoom}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <rect
                          x={-8}
                          y={-8}
                          width={16}
                          height={16}
                          rx={2}
                          fill="none"
                          stroke="#08090C"
                          strokeWidth={1.2 / zoom}
                          opacity="0.85"
                        />
                      </>
                    )}
                  </>
                )}

                {/* Direct Action Delete Badge on Canvas (Above selected troop) */}
                {isSelected && (
                  <g
                    transform={`translate(0, ${
                      -(troopClass === "elite" ? 30 : 22) / zoom
                    }) rotate(${-angle})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTroop(troop.id);
                    }}
                    className="cursor-pointer group/del"
                  >
                    <rect
                      x={-28 / zoom}
                      y={-9 / zoom}
                      width={56 / zoom}
                      height={18 / zoom}
                      rx={4 / zoom}
                      fill="rgba(225, 29, 72, 0.95)"
                      stroke="#FDA4AF"
                      strokeWidth={1 / zoom}
                      className="transition-all hover:fill-rose-600 hover:scale-105 shadow-lg"
                    />
                    <text
                      x={0}
                      y={3.5 / zoom}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={9.5 / zoom}
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="select-none pointer-events-none"
                    >
                      🗑 Excluir
                    </text>
                  </g>
                )}

                {/* Troop Designation Label & Payload Pill */}
                <g
                  transform={`translate(0, ${
                    (troopClass === "elite" ? 22 : 16) / zoom
                  }) rotate(${-angle})`}
                  className="pointer-events-none select-none"
                >
                  <rect
                    x={-(troop.name.length * 3.8 + (payload > 0 ? 16 : 8)) / zoom}
                    y={-8 / zoom}
                    width={(troop.name.length * 7.6 + (payload > 0 ? 32 : 16)) / zoom}
                    height={14 / zoom}
                    rx={2.5 / zoom}
                    fill="rgba(10, 13, 20, 0.88)"
                    stroke={isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.12)"}
                    strokeWidth={(isSelected ? 1.2 : 0.6) / zoom}
                  />
                  <text
                    x={0}
                    y={2 / zoom}
                    textAnchor="middle"
                    fill={isSelected ? "#FFFFFF" : "#E2E8F0"}
                    fontSize={8.5 / zoom}
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {troop.name}
                    {payload > 0 ? ` [${payload}]` : ""}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Planet Inspector Card / Procedural Forge Panel */}
      {inspectedPlanet && (
        <div
          data-hud="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="hud-element absolute bottom-6 right-6 z-50 bg-[#0C0F17]/95 border border-sky-500/30 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-2xl w-84 sm:w-[420px] max-h-[85vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-default font-mono text-xs"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: getFaction(inspectedPlanet.factionId).color }}
              />
              <span className="text-xs text-slate-200 font-bold uppercase tracking-wider truncate">
                {inspectedPlanet.name}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase flex-shrink-0"
                style={{
                  backgroundColor: `${getFaction(inspectedPlanet.factionId).color}15`,
                  color: getFaction(inspectedPlanet.factionId).color,
                  borderColor: `${getFaction(inspectedPlanet.factionId).color}40`,
                }}
              >
                {getFaction(inspectedPlanet.factionId).shortName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isGM && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setIsTranslocatingPlanetId(
                        isTranslocatingPlanetId === inspectedPlanet.id ? null : inspectedPlanet.id
                      )
                    }
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isTranslocatingPlanetId === inspectedPlanet.id
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                        : "text-slate-400 hover:text-white rounded-lg hover:bg-white/10 border-transparent"
                    }`}
                    title="Ativar/Desativar Translocação do Planeta"
                  >
                    <Move className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntityForModal(inspectedPlanet);
                      setSelectedEntityType("planet");
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Configuração avançada & Órbita (Mestre)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                onClick={() => setInspectedPlanet(null)}
                className="text-xs text-slate-500 hover:text-white cursor-pointer px-1 py-0.5"
              >
                [X]
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {/* GM Procedural Action Button */}
            {isGM && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRollPlanetInInspector(inspectedPlanet)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                  title="Gera atributos, clima e recursos procedurais aleatórios baseados nas regras estelares"
                >
                  <Dices className="w-4 h-4" />
                  <span>🎲 Gerar Atributos</span>
                </button>
              </div>
            )}

            {/* 2x3 Physical Attributes Grid */}
            <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Atributos Físicos (2x3)
              </span>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {/* 1. Tamanho */}
                <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase">Tamanho</span>
                  {isGM ? (
                    <select
                      value={typeof inspectedPlanet.size === "string" ? inspectedPlanet.size : "Médio"}
                      onChange={(e) =>
                        handleUpdatePlanetField(inspectedPlanet, {
                          size: e.target.value as any,
                        })
                      }
                      className="bg-transparent text-sky-300 font-bold text-center w-full focus:outline-none cursor-pointer text-xs"
                    >
                      {PLANET_SIZES.map((s) => (
                        <option key={s} value={s} className="bg-[#0C0F17]">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-sky-300">
                      {typeof inspectedPlanet.size === "string" ? inspectedPlanet.size : "Médio"}
                    </span>
                  )}
                </div>

                {/* 2. Tipo */}
                <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase">Tipo</span>
                  {isGM ? (
                    <select
                      value={inspectedPlanet.type || "Sólido"}
                      onChange={(e) =>
                        handleUpdatePlanetField(inspectedPlanet, {
                          type: e.target.value as any,
                        })
                      }
                      className="bg-transparent text-teal-300 font-bold text-center w-full focus:outline-none cursor-pointer text-xs"
                    >
                      {PLANET_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#0C0F17]">
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-teal-300">{inspectedPlanet.type || "Sólido"}</span>
                  )}
                </div>

                {/* 3. Temperatura */}
                <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase">Temperatura</span>
                  {isGM ? (
                    <select
                      value={inspectedPlanet.temperature || "Média"}
                      onChange={(e) =>
                        handleUpdatePlanetField(inspectedPlanet, {
                          temperature: e.target.value as any,
                        })
                      }
                      className="bg-transparent text-rose-300 font-bold text-center w-full focus:outline-none cursor-pointer text-xs"
                    >
                      {PLANET_TEMPERATURES.map((t) => (
                        <option key={t} value={t} className="bg-[#0C0F17]">
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-rose-300">
                      {inspectedPlanet.temperature || "Média"}
                    </span>
                  )}
                </div>

                {/* 4. Atmosfera */}
                <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase">Atmosfera</span>
                  {isGM ? (
                    <select
                      value={inspectedPlanet.atmosphere || "Respirável"}
                      onChange={(e) =>
                        handleUpdatePlanetField(inspectedPlanet, {
                          atmosphere: e.target.value as any,
                        })
                      }
                      className="bg-transparent text-cyan-300 font-bold text-center w-full focus:outline-none cursor-pointer text-xs"
                    >
                      {PLANET_ATMOSPHERES.map((a) => (
                        <option key={a} value={a} className="bg-[#0C0F17]">
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-cyan-300">
                      {inspectedPlanet.atmosphere || "Respirável"}
                    </span>
                  )}
                </div>

                {/* 5. Gravidade */}
                <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase">Gravidade</span>
                  {isGM ? (
                    <select
                      value={inspectedPlanet.gravity || "Normal"}
                      onChange={(e) =>
                        handleUpdatePlanetField(inspectedPlanet, {
                          gravity: e.target.value as any,
                        })
                      }
                      className="bg-transparent text-indigo-300 font-bold text-center w-full focus:outline-none cursor-pointer text-xs"
                    >
                      {PLANET_GRAVITIES.map((g) => (
                        <option key={g} value={g} className="bg-[#0C0F17]">
                          {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-indigo-300">
                      {inspectedPlanet.gravity || "Normal"}
                    </span>
                  )}
                </div>

                {/* 6. Órbita */}
                <button
                  type="button"
                  onClick={() => isGM && handleToggleAnomalousOrbit(inspectedPlanet)}
                  disabled={!isGM}
                  className={`p-1.5 rounded-xl border text-left transition-all ${
                    isGM ? "hover:border-amber-400/50 cursor-pointer" : "cursor-default"
                  } ${
                    inspectedPlanet.anomalousOrbit?.enabled
                      ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                      : "bg-white/5 border-white/5 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 block uppercase">Órbita</span>
                    {isGM && (
                      <span className="text-[8px] font-mono text-amber-400 uppercase tracking-tighter">
                        Alternar
                      </span>
                    )}
                  </div>
                  <span className="font-bold block text-[11px] truncate">
                    {inspectedPlanet.anomalousOrbit?.enabled ? "Anômala" : "Padrão"}
                  </span>
                </button>
              </div>
            </div>

            {/* GM Translocation Control Center */}
            {isGM && (
              <div className="p-2.5 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Translocação do Planeta</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsTranslocatingPlanetId(
                        isTranslocatingPlanetId === inspectedPlanet.id ? null : inspectedPlanet.id
                      )
                    }
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isTranslocatingPlanetId === inspectedPlanet.id
                        ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] ring-1 ring-cyan-400/50"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <Move className="w-3 h-3" />
                    <span>
                      {isTranslocatingPlanetId === inspectedPlanet.id
                        ? "Desativar"
                        : "Ativar Translocação"}
                    </span>
                  </button>
                </div>

                {isTranslocatingPlanetId === inspectedPlanet.id && (
                  <div className="space-y-2 pt-1 border-t border-white/10 animate-in fade-in duration-150">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTranslocationMode("orbit")}
                        className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          translocationMode === "orbit"
                            ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Orbit className="w-3 h-3 text-cyan-400" />
                        <span>No Tracejado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTranslocationMode("free")}
                        className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          translocationMode === "free"
                            ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Move className="w-3 h-3 text-amber-400" />
                        <span>Coordenadas Livres</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      {translocationMode === "orbit"
                        ? "✦ Arraste o planeta no mapa ou use a barra abaixo para deslizar sobre a linha tracejada da órbita."
                        : "✦ Arraste o planeta livremente pelo mapa. A órbita se recalcula para continuar acompanhando o planeta."}
                    </p>

                    {/* Orbital Phase Slider & Quick Step Buttons */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-cyan-400" />
                          <span>Fase Orbital (Ângulo)</span>
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {(() => {
                            let p = inspectedPlanet.orbitalPhase;
                            if (typeof p !== "number") {
                              if (inspectedPlanet.anomalousOrbit?.enabled) {
                                p = getClosestPhaseOnAnomalousOrbit(
                                  inspectedPlanet.anomalousOrbit,
                                  inspectedPlanet.x,
                                  inspectedPlanet.y
                                );
                              } else {
                                p = Math.round(
                                  (Math.atan2(inspectedPlanet.y, inspectedPlanet.x) * 180) / Math.PI
                                );
                                if (p < 0) p += 360;
                              }
                            }
                            return `${p}°`;
                          })()}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={(() => {
                          let p = inspectedPlanet.orbitalPhase;
                          if (typeof p !== "number") {
                            if (inspectedPlanet.anomalousOrbit?.enabled) {
                              p = getClosestPhaseOnAnomalousOrbit(
                                inspectedPlanet.anomalousOrbit,
                                inspectedPlanet.x,
                                inspectedPlanet.y
                              );
                            } else {
                              p = Math.round(
                                (Math.atan2(inspectedPlanet.y, inspectedPlanet.x) * 180) / Math.PI
                              );
                              if (p < 0) p += 360;
                            }
                          }
                          return p;
                        })()}
                        onChange={(e) =>
                          handleSetPlanetPhase(inspectedPlanet, parseInt(e.target.value) || 0)
                        }
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-black/60 rounded-lg"
                      />

                      <div className="grid grid-cols-4 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStepPlanetPhase(inspectedPlanet, -45)}
                          className="py-1 px-1 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 rounded-lg text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          -45°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepPlanetPhase(inspectedPlanet, -15)}
                          className="py-1 px-1 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 rounded-lg text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          ◀ -15°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepPlanetPhase(inspectedPlanet, 15)}
                          className="py-1 px-1 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 rounded-lg text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          +15° ▶
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepPlanetPhase(inspectedPlanet, 45)}
                          className="py-1 px-1 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/5 rounded-lg text-[9px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          +45°
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Anomalous Orbit Sun Centering Status & Fix Button */}
            {isGM && inspectedPlanet.anomalousOrbit?.enabled && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[10px]">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Orbit className="w-3.5 h-3.5 text-amber-400" />
                  <span>Centro da Elipse:</span>
                  <span className="font-mono text-slate-300">
                    {inspectedPlanet.anomalousOrbit.centerX === 0 && inspectedPlanet.anomalousOrbit.centerY === 0
                      ? "Sol (0, 0) ✓"
                      : `(${inspectedPlanet.anomalousOrbit.centerX}, ${inspectedPlanet.anomalousOrbit.centerY})`}
                  </span>
                </div>
                {(inspectedPlanet.anomalousOrbit.centerX !== 0 || inspectedPlanet.anomalousOrbit.centerY !== 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const calibrated = calibrateAnomalousOrbitToPlanet(
                        inspectedPlanet.x,
                        inspectedPlanet.y,
                        0,
                        0,
                        inspectedPlanet.anomalousOrbit?.rotation || 0,
                        0.65
                      );
                      const updated: Planet = {
                        ...inspectedPlanet,
                        anomalousOrbit: calibrated,
                        orbitalPhase: calibrated.orbitalPhase,
                      };
                      setInspectedPlanet(updated);
                      const updatedPlanets = localPlanets.map((p) =>
                        p.id === inspectedPlanet.id ? updated : p
                      );
                      commitPlanets(updatedPlanets);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/50 font-bold transition-colors cursor-pointer"
                  >
                    Fixar no Sol (0, 0)
                  </button>
                )}
              </div>
            )}

            {/* Special Neon Traits */}
            {inspectedPlanet.traits &&
              inspectedPlanet.traits.filter((t) => typeof t === "string" && t.trim().length > 0).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Sinais Especiais Detectados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedPlanet.traits
                    .filter((t) => typeof t === "string" && t.trim().length > 0)
                    .map((trait) => {
                      const isLife =
                        trait === SPECIAL_TRAITS.INTELLIGENT_LIFE ||
                        trait === SPECIAL_TRAITS.ADVANCED_CIVILIZATION;
                      const isRuins = trait === SPECIAL_TRAITS.PRECURSOR_RUINS;
                      return (
                        <span
                          key={trait}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                            isRuins
                              ? "bg-amber-500/20 text-amber-200 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                              : isLife
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                              : "bg-purple-500/20 text-purple-200 border-purple-400"
                          }`}
                        >
                          {isRuins && <Wand2 className="w-3 h-3 text-amber-300 flex-shrink-0" />}
                          {isLife && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                          )}
                          <span>{trait}</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tags de Recursos (Pílulas Visuais com Edição e z-[9999]) */}
            <div className="space-y-1.5 overflow-visible relative z-[9999]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Depósitos de Recursos Identificados
                </span>
                {isGM && (
                  <button
                    type="button"
                    onClick={() => setIsAddingResourceInInspector((prev) => !prev)}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingResourceInInspector ? "Fechar" : "+ Recurso"}</span>
                  </button>
                )}
              </div>

              {/* Popover de Adicionar Recurso (z-[9999]) */}
              {isGM && isAddingResourceInInspector && (
                <div className="p-2 bg-[#0A0D14] border border-amber-400/40 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-2 relative z-[9999] animate-in fade-in duration-150">
                  <select
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-black/80 border border-white/20 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-amber-400"
                  >
                    {ALL_PLANET_RESOURCES.map((r) => (
                      <option key={r} value={r} className="bg-[#0C0F17]">
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddPlanetResource(inspectedPlanet, newResourceName)}
                    className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-lg text-xs transition-all shadow cursor-pointer flex-shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 overflow-visible relative">
                {(!inspectedPlanet.resources || inspectedPlanet.resources.length === 0) ? (
                  <span className="text-[11px] text-slate-500 italic">
                    Nenhum recurso mapeado neste setor planetário.
                  </span>
                ) : (
                  inspectedPlanet.resources.map((res) => {
                    const theme = RESOURCE_THEMES[res.name] || {
                      badgeBg: "bg-white/10",
                      borderColor: "border-white/20",
                      textColor: "text-slate-200",
                    };
                    return (
                      <div
                        key={res.name}
                        onClick={() => isGM && handleCyclePlanetResourceLevel(inspectedPlanet, res.name)}
                        title={
                          isGM
                            ? `${res.name} (Nível ${res.level}) • Clique para alternar nível`
                            : `${res.name} (${res.level})`
                        }
                        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
                          theme.badgeBg
                        } ${theme.borderColor} ${theme.textColor} ${
                          isGM ? "cursor-pointer hover:border-amber-400 hover:shadow-[0_0_8px_rgba(251,191,36,0.25)]" : ""
                        }`}
                      >
                        <span>{res.name}</span>
                        <span className="text-[10px] text-amber-300 font-mono ml-0.5 bg-black/40 px-1 py-0.2 rounded">
                          {getResourceLevelArrows(res.level)} {res.level}
                        </span>
                        {isGM && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlanetResource(inspectedPlanet, res.name);
                            }}
                            title="Remover recurso"
                            className="p-0.5 text-slate-400 hover:text-rose-400 transition-colors ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coordinates & Orbit report */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/30 p-2 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 block text-[9px]">COORDENADAS</span>
                <span className="text-slate-300 text-[11px]">
                  X: {Math.round(inspectedPlanet.x)} | Y: {Math.round(inspectedPlanet.y)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">RAIO ORBITAL</span>
                <span className="text-slate-300 text-[11px]">
                  {inspectedPlanet.anomalousOrbit?.enabled
                    ? `Anômala (${Math.round(inspectedPlanet.anomalousOrbit.radiusX)}x${Math.round(
                        inspectedPlanet.anomalousOrbit.radiusY
                      )})`
                    : `${Math.round(inspectedPlanet.orbitRadius)} AU`}
                </span>
              </div>
            </div>

            {inspectedPlanet.notes && (
              <div className="text-[11px] text-slate-300 bg-white/5 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 block mb-0.5 uppercase">
                  Relatório Orbital:
                </span>
                {inspectedPlanet.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planet GM Configuration Modal */}
      {isGM && (
        <EntityModal
          entity={selectedEntityForModal}
          entityType={selectedEntityType}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEntityForModal(null);
          }}
          onSave={handleSaveModalEntity}
          onDelete={handleDeleteModalEntity}
        />
      )}
    </div>
  );
};
