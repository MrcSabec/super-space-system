"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { MapState, PlayerCharacter, Campaign } from "@/types/sss";
import { commitBlueprintBatch, saveMapState, savePlayerCharacter, updateCampaignDiplomacy } from "@/lib/db";

export type GameMode = "LIVE" | "BLUEPRINT";

interface GameStateContextType {
  mode: GameMode;
  isLive: boolean;
  pendingCount: number;
  isApplying: boolean;
  setMode: (mode: GameMode) => void;
  toggleMode: () => void;

  // Effective state (merges draft mutations onto base live state)
  effectiveMapState: MapState;
  effectiveCharacters: PlayerCharacter[];
  effectiveDiplomacy: Record<string, string>;

  // Intercepted mutation handlers
  updateMapState: (newMap: MapState) => Promise<void>;
  updateCharacter: (char: PlayerCharacter) => Promise<void>;
  updateDiplomacy: (relations: Record<string, string>) => Promise<void>;

  // Batch commit & discard actions
  applyBlueprint: () => Promise<void>;
  discardBlueprint: () => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

interface GameStateProviderProps {
  children: React.ReactNode;
  campaignId: string;
  serverMapState: MapState;
  serverCharacters: PlayerCharacter[];
  serverCampaign: Campaign;
  onServerMapStateChange?: (newMap: MapState) => void;
  onServerCharactersChange?: (chars: PlayerCharacter[]) => void;
  onServerCampaignChange?: (camp: Campaign) => void;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({
  children,
  campaignId,
  serverMapState,
  serverCharacters,
  serverCampaign,
  onServerMapStateChange,
  onServerCharactersChange,
  onServerCampaignChange,
}) => {
  const [mode, setModeState] = useState<GameMode>("LIVE");
  const isLive = mode === "LIVE";

  // Draft states (in-memory offline staging)
  const [draftMapState, setDraftMapState] = useState<MapState | null>(null);
  const [draftCharacters, setDraftCharacters] = useState<Record<string, PlayerCharacter>>({});
  const [draftDiplomacy, setDraftDiplomacy] = useState<Record<string, string> | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Keep a reference of initial baseline when entering Blueprint mode
  const [baselineMap, setBaselineMap] = useState<MapState | null>(null);
  const [baselineChars, setBaselineChars] = useState<Record<string, PlayerCharacter>>({});
  const [baselineDiplomacy, setBaselineDiplomacy] = useState<Record<string, string> | null>(null);

  // Toggle mode with baseline initialization
  const setMode = useCallback(
    (newMode: GameMode) => {
      if (newMode === "BLUEPRINT" && mode === "LIVE") {
        setBaselineMap(serverMapState);
        const charsMap: Record<string, PlayerCharacter> = {};
        for (const c of serverCharacters) {
          charsMap[c.id] = c;
        }
        setBaselineChars(charsMap);
        setBaselineDiplomacy(serverCampaign.diplomatic_relations || {});
        // Start draft with clones
        setDraftMapState(serverMapState);
        setDraftCharacters({});
        setDraftDiplomacy(null);
      }
      setModeState(newMode);
    },
    [mode, serverMapState, serverCharacters, serverCampaign]
  );

  const toggleMode = useCallback(() => {
    setMode(mode === "LIVE" ? "BLUEPRINT" : "LIVE");
  }, [mode, setMode]);

  // Compute effective state
  const effectiveMapState = useMemo(() => {
    if (isLive) return serverMapState;
    return draftMapState ?? serverMapState;
  }, [isLive, serverMapState, draftMapState]);

  const effectiveCharacters = useMemo(() => {
    if (isLive) return serverCharacters;
    return serverCharacters.map((char) => draftCharacters[char.id] || char);
  }, [isLive, serverCharacters, draftCharacters]);

  const effectiveDiplomacy = useMemo(() => {
    if (isLive) return serverCampaign.diplomatic_relations || {};
    return draftDiplomacy ?? (serverCampaign.diplomatic_relations || {});
  }, [isLive, serverCampaign.diplomatic_relations, draftDiplomacy]);

  // Compute pending changes count
  const pendingCount = useMemo(() => {
    if (isLive) return 0;
    let count = 0;

    // Check map differences (planets & troops count or coordinates)
    if (draftMapState && baselineMap) {
      const pDiff = Math.abs((draftMapState.planets?.length || 0) - (baselineMap.planets?.length || 0));
      const tDiff = Math.abs((draftMapState.troops?.length || 0) - (baselineMap.troops?.length || 0));
      count += pDiff + tDiff;

      // Check moved or edited planets
      for (const p of draftMapState.planets || []) {
        const orig = baselineMap.planets?.find((bp) => bp.id === p.id);
        if (
          orig &&
          (orig.x !== p.x ||
            orig.y !== p.y ||
            orig.orbitalPhase !== p.orbitalPhase ||
            orig.size !== p.size ||
            orig.type !== p.type ||
            orig.anomalousOrbit?.enabled !== p.anomalousOrbit?.enabled)
        ) {
          count += 1;
        }
      }

      // Check moved or edited troops
      for (const t of draftMapState.troops || []) {
        const orig = baselineMap.troops?.find((bt) => bt.id === t.id);
        if (orig && (orig.x !== t.x || orig.y !== t.y || orig.payload !== t.payload)) {
          count += 1;
        }
      }
    }

    // Check character changes
    count += Object.keys(draftCharacters).length;

    // Check diplomacy changes
    if (draftDiplomacy && baselineDiplomacy) {
      const keys = new Set([
        ...Object.keys(draftDiplomacy),
        ...Object.keys(baselineDiplomacy),
      ]);
      let dipChanges = 0;
      for (const k of keys) {
        if (draftDiplomacy[k] !== baselineDiplomacy[k]) {
          dipChanges += 1;
        }
      }
      if (dipChanges > 0) count += dipChanges;
    }

    // If draftMapState exists and was updated at least once, count is at least 1
    if (draftMapState && draftMapState !== baselineMap && count === 0) {
      count = 1;
    }

    return count;
  }, [isLive, draftMapState, baselineMap, draftCharacters, draftDiplomacy, baselineDiplomacy]);

  // Intercepted Mutation: Map State
  const updateMapState = useCallback(
    async (newMap: MapState) => {
      if (isLive) {
        onServerMapStateChange?.(newMap);
        await saveMapState(campaignId, newMap);
      } else {
        // Intercept: update local draft in memory only!
        setDraftMapState(newMap);
      }
    },
    [isLive, campaignId, onServerMapStateChange]
  );

  // Intercepted Mutation: Character
  const updateCharacter = useCallback(
    async (char: PlayerCharacter) => {
      if (isLive) {
        const updated = serverCharacters.map((c) => (c.id === char.id ? char : c));
        onServerCharactersChange?.(updated);
        await savePlayerCharacter(char);
      } else {
        // Intercept: record mutation in local draft
        setDraftCharacters((prev) => ({
          ...prev,
          [char.id]: char,
        }));
      }
    },
    [isLive, serverCharacters, onServerCharactersChange]
  );

  // Intercepted Mutation: Diplomacy
  const updateDiplomacy = useCallback(
    async (relations: Record<string, string>) => {
      if (isLive) {
        onServerCampaignChange?.({
          ...serverCampaign,
          diplomatic_relations: relations,
        });
        await updateCampaignDiplomacy(campaignId, relations);
      } else {
        // Intercept: record in draft
        setDraftDiplomacy(relations);
      }
    },
    [isLive, campaignId, serverCampaign, onServerCampaignChange]
  );

  // Commit Batch (writeBatch on Firestore / batch on server API)
  const applyBlueprint = useCallback(async () => {
    setIsApplying(true);
    try {
      const payload = {
        mapState: draftMapState || undefined,
        characters:
          Object.keys(draftCharacters).length > 0
            ? Object.values(draftCharacters)
            : undefined,
        diplomacy: draftDiplomacy || undefined,
      };

      await commitBlueprintBatch(campaignId, payload);

      // Update parent states
      if (draftMapState) {
        onServerMapStateChange?.(draftMapState);
      }
      if (Object.keys(draftCharacters).length > 0) {
        const updatedList = serverCharacters.map(
          (c) => draftCharacters[c.id] || c
        );
        onServerCharactersChange?.(updatedList);
      }
      if (draftDiplomacy) {
        onServerCampaignChange?.({
          ...serverCampaign,
          diplomatic_relations: draftDiplomacy,
        });
      }

      // Clear draft states
      setDraftMapState(null);
      setDraftCharacters({});
      setDraftDiplomacy(null);
      setBaselineMap(null);
      setBaselineChars({});
      setBaselineDiplomacy(null);

      // Return automatically to LIVE mode
      setModeState("LIVE");
    } catch (err) {
      console.error("Error applying blueprint batch:", err);
      throw err;
    } finally {
      setIsApplying(false);
    }
  }, [
    campaignId,
    draftMapState,
    draftCharacters,
    draftDiplomacy,
    serverCharacters,
    serverCampaign,
    onServerMapStateChange,
    onServerCharactersChange,
    onServerCampaignChange,
  ]);

  // Discard draft and revert to live state
  const discardBlueprint = useCallback(() => {
    setDraftMapState(null);
    setDraftCharacters({});
    setDraftDiplomacy(null);
    setBaselineMap(null);
    setBaselineChars({});
    setBaselineDiplomacy(null);
    setModeState("LIVE");
  }, []);

  // Edge Case: Window BeforeUnload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isLive && pendingCount > 0) {
        e.preventDefault();
        e.returnValue =
          "Você tem alterações de Blueprint não aplicadas. Deseja sair mesmo assim?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLive, pendingCount]);

  return (
    <GameStateContext.Provider
      value={{
        mode,
        isLive,
        pendingCount,
        isApplying,
        setMode,
        toggleMode,
        effectiveMapState,
        effectiveCharacters,
        effectiveDiplomacy,
        updateMapState,
        updateCharacter,
        updateDiplomacy,
        applyBlueprint,
        discardBlueprint,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export function useGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}
