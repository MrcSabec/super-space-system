import { db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { User, Campaign, MapState, Planet, Troop, FactionId, PlayerCharacter } from "@/types/sss";
import { INITIAL_TURN0_DIPLOMATIC_RELATIONS } from "./diplomacy";

// --- Hash Utility ---
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(password);
}

// --- Unique Code Generator (e.g. SSS-A8F9K) ---
export function generateCampaignCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SSS-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// LOCAL STORAGE & SERVER-BACKED FALLBACK ENGINE
// Guarantees all browsers (Opera, Chrome, Incognito) share the same rooms
// even before Firebase keys are configured!
// ============================================================================
const LS_USERS = "sss_users_v1";
const LS_CAMPAIGNS = "sss_campaigns_v1";
const LS_MAPS = "sss_maps_v1";
const LS_CHARACTERS = "sss_characters_v1";

function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Local storage write error:", err);
  }
}

// ============================================================================
// MODULE 1: AUTHENTICATION (FRICTIONLESS LOGIN)
// ============================================================================
export async function authenticateOrRegisterUser(
  usernameInput: string,
  passwordInput: string
): Promise<User> {
  const username = usernameInput.trim().toLowerCase();
  if (!username) throw new Error("Identificador (Username) é obrigatório.");
  if (!passwordInput) throw new Error("Chave de Acesso (Password) é obrigatória.");

  const passHash = await hashPassword(passwordInput);

  if (isFirebaseConfigured() && db) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      if (userData.passwordHash !== passHash) {
        throw new Error("Chave de acesso incorreta para este identificador.");
      }
      return userData;
    } else {
      const newUserId = doc(usersRef).id;
      const newUser: User = {
        id: newUserId,
        username,
        passwordHash: passHash,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "users", newUserId), newUser);
      return newUser;
    }
  }

  // --- Server-backed fallback for cross-browser sharing ---
  try {
    const res = await fetch(`/api/store?type=user&username=${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        if (data.user.passwordHash !== passHash) {
          throw new Error("Chave de acesso incorreta para este identificador.");
        }
        return data.user as User;
      }
    }

    // User not found -> auto create on server
    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      username,
      passwordHash: passHash,
      createdAt: Date.now(),
    };

    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_user", payload: newUser }),
    });

    return newUser;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Chave de acesso")) {
      throw err;
    }
    // Fallback to local
    const users = getLocalItem<Record<string, User>>(LS_USERS, {});
    if (users[username]) {
      if (users[username].passwordHash !== passHash) {
        throw new Error("Chave de acesso incorreta para este identificador.");
      }
      return users[username];
    }
    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      username,
      passwordHash: passHash,
      createdAt: Date.now(),
    };
    users[username] = newUser;
    setLocalItem(LS_USERS, users);
    return newUser;
  }
}

// ============================================================================
// MODULE 2: CAMPAIGN HUB (DASHBOARD)
// ============================================================================
export async function createCampaign(params: {
  name: string;
  allowedFactions: FactionId[];
  initialPlanets: number;
  gmId: string;
  gmUsername: string;
}): Promise<Campaign> {
  const campaignCode = generateCampaignCode();
  const campaignId = "cmp_" + Math.random().toString(36).substring(2, 10);
  const now = Date.now();

  const newCampaign: Campaign = {
    id: campaignId,
    campaignCode,
    name: params.name.trim() || "Novo Setor Galáctico",
    gmId: params.gmId,
    gmUsername: params.gmUsername,
    allowedFactions: params.allowedFactions.length > 0 ? params.allowedFactions : ["federation", "neutral"],
    initialPlanets: params.initialPlanets,
    players: [],
    diplomatic_relations: { ...INITIAL_TURN0_DIPLOMATIC_RELATIONS },
    createdAt: now,
  };

  // Procedural Initial Planets with concentric orbits around central star (0,0)
  const planets: Planet[] = [];
  const baseRadii = [90, 150, 210, 270, 330, 390, 450, 510, 570, 630];
  const planetNames = ["Solas-I", "Aethel", "Vanguard", "Kalliope", "Obsidia", "Cryon-9", "Zephyr", "Tartarus", "Chronos", "Nadir"];

  for (let i = 0; i < Math.min(params.initialPlanets, 10); i++) {
    const radius = baseRadii[i] || (100 + i * 50);
    const angle = (i * 1.35) + (Math.random() * 0.4 - 0.2);
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));

    planets.push({
      id: `plt_${i + 1}_` + Math.random().toString(36).substring(2, 6),
      name: planetNames[i] || `Planeta-${i + 1}`,
      x,
      y,
      orbitRadius: radius,
      factionId: "neutral",
      size: 16,
      notes: `Setor orbital ${i + 1}`,
    });
  }

  const initialMapState: MapState = {
    planets,
    troops: [],
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, "campaigns", campaignId), newCampaign);
    await setDoc(doc(db, "campaign_maps", campaignId), initialMapState);
    return newCampaign;
  }

  // --- Save to Next.js Server Store (shared across all browsers) ---
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_campaign", payload: newCampaign }),
    });
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_map",
        payload: { campaignId, mapState: initialMapState },
      }),
    });
  } catch (err) {
    console.warn("Server store write failed, saving locally:", err);
  }

  // Local backup
  const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
  campaigns[campaignId] = newCampaign;
  setLocalItem(LS_CAMPAIGNS, campaigns);

  const maps = getLocalItem<Record<string, MapState>>(LS_MAPS, {});
  maps[campaignId] = initialMapState;
  setLocalItem(LS_MAPS, maps);

  return newCampaign;
}

export async function getUserCampaigns(username: string): Promise<Campaign[]> {
  const normUser = username.trim().toLowerCase();

  if (isFirebaseConfigured() && db) {
    try {
      const campaignsRef = collection(db, "campaigns");
      const allDocs = await getDocs(campaignsRef);
      const list: Campaign[] = [];
      allDocs.forEach((d) => {
        const c = d.data() as Campaign;
        if (
          c.gmUsername.toLowerCase() === normUser ||
          c.players?.some((p) => p.toLowerCase() === normUser)
        ) {
          list.push(c);
        }
      });
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.warn("Firestore getUserCampaigns error, using fallback:", err);
    }
  }

  // --- Server store query ---
  try {
    const res = await fetch(
      `/api/store?type=campaigns_for_user&username=${encodeURIComponent(normUser)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.campaigns)) {
        return data.campaigns as Campaign[];
      }
    }
  } catch (err) {
    console.warn("Server store getUserCampaigns error, using local:", err);
  }

  // Local backup
  const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
  return Object.values(campaigns)
    .filter(
      (c) =>
        c.gmUsername.toLowerCase() === normUser ||
        c.players?.some((p) => p.toLowerCase() === normUser)
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, "campaigns", campaignId));
      if (snap.exists()) {
        const c = snap.data() as Campaign;
        if (!c.diplomatic_relations || Object.keys(c.diplomatic_relations).length === 0) {
          c.diplomatic_relations = { ...INITIAL_TURN0_DIPLOMATIC_RELATIONS };
        }
        return c;
      }
    } catch (err) {
      console.warn("Firestore getCampaign error:", err);
    }
  }

  // --- Server store query ---
  try {
    const res = await fetch(`/api/store?type=campaign&id=${encodeURIComponent(campaignId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.campaign) {
        const c = data.campaign as Campaign;
        if (!c.diplomatic_relations || Object.keys(c.diplomatic_relations).length === 0) {
          c.diplomatic_relations = { ...INITIAL_TURN0_DIPLOMATIC_RELATIONS };
        }
        return c;
      }
    }
  } catch {}

  const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
  const localCamp = campaigns[campaignId] || null;
  if (localCamp && (!localCamp.diplomatic_relations || Object.keys(localCamp.diplomatic_relations).length === 0)) {
    localCamp.diplomatic_relations = { ...INITIAL_TURN0_DIPLOMATIC_RELATIONS };
  }
  return localCamp;
}

export function subscribeCampaign(
  campaignId: string,
  onUpdate: (campaign: Campaign) => void
): () => void {
  const enrichCamp = (c: Campaign): Campaign => {
    if (!c.diplomatic_relations || Object.keys(c.diplomatic_relations).length === 0) {
      return { ...c, diplomatic_relations: { ...INITIAL_TURN0_DIPLOMATIC_RELATIONS } };
    }
    return c;
  };

  if (isFirebaseConfigured() && db) {
    try {
      const unsubscribe = onSnapshot(
        doc(db, "campaigns", campaignId),
        (docSnap) => {
          if (docSnap.exists()) {
            onUpdate(enrichCamp(docSnap.data() as Campaign));
          }
        },
        (err) => {
          console.warn("Firestore subscribeCampaign onSnapshot error:", err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Firestore subscribeCampaign onSnapshot error, falling back to local:", err);
    }
  }

  // Initial load from server store
  fetch(`/api/store?type=campaign&id=${encodeURIComponent(campaignId)}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.campaign) onUpdate(enrichCamp(data.campaign));
    })
    .catch(() => {});

  // Cross-browser polling interval (2 seconds)
  const pollInterval = setInterval(() => {
    fetch(`/api/store?type=campaign&id=${encodeURIComponent(campaignId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) onUpdate(data.campaign);
      })
      .catch(() => {});
  }, 2000);

  // Multi-tab sync via BroadcastChannel
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    bc = new BroadcastChannel(`sss_campaign_${campaignId}`);
    bc.onmessage = (event) => {
      if (event.data) onUpdate(event.data as Campaign);
    };
  }

  return () => {
    clearInterval(pollInterval);
    if (bc) bc.close();
  };
}

export async function updateCampaignDiplomacy(
  campaignId: string,
  relations: Record<string, string>
): Promise<void> {
  // 1. Firebase Firestore
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, "campaigns", campaignId), {
        diplomatic_relations: relations,
      });
      return;
    } catch (err) {
      console.warn("Firestore updateCampaignDiplomacy error, saving locally:", err);
    }
  }

  // 2. Server Store
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_campaign_diplomacy",
        payload: { campaignId, relations },
      }),
    });
  } catch {}

  // 3. Local fallback & Broadcast
  const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
  if (campaigns[campaignId]) {
    campaigns[campaignId].diplomatic_relations = {
      ...(campaigns[campaignId].diplomatic_relations || {}),
      ...relations,
    };
    setLocalItem(LS_CAMPAIGNS, campaigns);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(`sss_campaign_${campaignId}`);
      bc.postMessage(campaigns[campaignId]);
      bc.close();
    }
  }
}

export async function joinCampaignByCode(
  campaignCodeInput: string,
  username: string
): Promise<Campaign> {
  const code = campaignCodeInput.trim().toUpperCase();
  const normUser = username.trim().toLowerCase();

  if (isFirebaseConfigured() && db) {
    const q = query(collection(db, "campaigns"), where("campaignCode", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error(`Nenhuma campanha encontrada com o código "${code}".`);
    }

    const campaignDoc = snap.docs[0];
    const campaign = campaignDoc.data() as Campaign;

    if (!campaign.players.includes(normUser) && campaign.gmUsername.toLowerCase() !== normUser) {
      await updateDoc(doc(db, "campaigns", campaign.id), {
        players: arrayUnion(normUser),
      });
      campaign.players.push(normUser);
    }

    return campaign;
  }

  // --- Server-backed join (works across all browsers!) ---
  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join_campaign",
        payload: { campaignCode: code, username: normUser },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Nenhuma campanha encontrada com o código "${code}".`);
    }

    // Save to local backup as well
    const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
    campaigns[data.campaign.id] = data.campaign;
    setLocalItem(LS_CAMPAIGNS, campaigns);

    return data.campaign as Campaign;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Nenhuma campanha")) {
      throw err;
    }
    // Fallback to local
    const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
    const found = Object.values(campaigns).find((c) => c.campaignCode.toUpperCase() === code);
    if (!found) {
      throw new Error(`Nenhuma campanha encontrada com o código "${code}".`);
    }

    if (!found.players.includes(normUser) && found.gmUsername.toLowerCase() !== normUser) {
      found.players.push(normUser);
      campaigns[found.id] = found;
      setLocalItem(LS_CAMPAIGNS, campaigns);
    }

    return found;
  }
}

// ============================================================================
// MODULE 3: REALTIME MAP STATE & SYNCHRONIZATION
// ============================================================================
export function subscribeMapState(
  campaignId: string,
  onUpdate: (state: MapState) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    try {
      const unsubscribe = onSnapshot(
        doc(db, "campaign_maps", campaignId),
        (docSnap) => {
          if (docSnap.exists()) {
            const raw = docSnap.data() as Partial<MapState>;
            onUpdate({
              planets: Array.isArray(raw.planets) ? raw.planets : [],
              troops: Array.isArray(raw.troops) ? raw.troops : [],
              updatedAt: raw.updatedAt || Date.now(),
            });
          }
        },
        (err) => {
          console.warn("Firestore subscribeMapState onSnapshot error:", err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Firestore onSnapshot error, falling back to local channel:", err);
    }
  }

  // Initial load from server store
  fetch(`/api/store?type=map&campaignId=${encodeURIComponent(campaignId)}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.map) onUpdate(data.map);
    })
    .catch(() => {});

  // Cross-browser polling interval (2 seconds)
  const pollInterval = setInterval(() => {
    fetch(`/api/store?type=map&campaignId=${encodeURIComponent(campaignId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.map) onUpdate(data.map);
      })
      .catch(() => {});
  }, 2000);

  // Multi-tab sync via BroadcastChannel
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    bc = new BroadcastChannel(`sss_map_${campaignId}`);
    bc.onmessage = (event) => {
      if (event.data) onUpdate(event.data as MapState);
    };
  }

  return () => {
    clearInterval(pollInterval);
    if (bc) bc.close();
  };
}

/**
 * Recursively removes all keys with undefined values so Firebase Firestore
 * setDoc/updateDoc/writeBatch never throws "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

export async function saveMapState(campaignId: string, state: MapState): Promise<void> {
  const updatedState = {
    planets: state.planets || [],
    troops: state.troops || [],
    updatedAt: Date.now(),
  };
  const sanitized = sanitizeForFirestore(updatedState);

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "campaign_maps", campaignId), sanitized, { merge: true });
      try {
        await setDoc(doc(db, "campaigns", campaignId), { mapState: sanitized }, { merge: true });
      } catch {}
      return;
    } catch (err) {
      console.warn("Firestore saveMapState error, saving locally:", err);
    }
  }

  // --- Save to Server Store (syncs all browsers) ---
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_map",
        payload: { campaignId, mapState: updatedState },
      }),
    });
  } catch {}

  // Local Save & Broadcast
  const maps = getLocalItem<Record<string, MapState>>(LS_MAPS, {});
  maps[campaignId] = updatedState;
  setLocalItem(LS_MAPS, maps);

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const bc = new BroadcastChannel(`sss_map_${campaignId}`);
    bc.postMessage(updatedState);
    bc.close();
  }
}

/**
 * Persists troops separately using Firestore merge so updating planets
 * NEVER wipes out troops, and adding/moving troops never affects planets.
 */
export async function saveMapTroops(campaignId: string, troops: Troop[]): Promise<void> {
  const sanitized = sanitizeForFirestore(troops || []);
  const now = Date.now();

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(
        doc(db, "campaign_maps", campaignId),
        { troops: sanitized, updatedAt: now },
        { merge: true }
      );
      return;
    } catch (err) {
      console.warn("Firestore saveMapTroops error, saving locally:", err);
    }
  }

  // Fallback to local store
  const maps = getLocalItem<Record<string, MapState>>(LS_MAPS, {});
  const current = maps[campaignId] || { planets: [], troops: [], updatedAt: now };
  const updatedState: MapState = { ...current, troops, updatedAt: now };
  maps[campaignId] = updatedState;
  setLocalItem(LS_MAPS, maps);

  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_map_troops",
        payload: { campaignId, troops: sanitized },
      }),
    });
  } catch {}

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const bc = new BroadcastChannel(`sss_map_${campaignId}`);
    bc.postMessage(updatedState);
    bc.close();
  }
}

/**
 * Persists planets separately using Firestore merge so updating planets
 * NEVER wipes out player troops.
 */
export async function saveMapPlanets(campaignId: string, planets: Planet[]): Promise<void> {
  const sanitized = sanitizeForFirestore(planets || []);
  const now = Date.now();

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(
        doc(db, "campaign_maps", campaignId),
        { planets: sanitized, updatedAt: now },
        { merge: true }
      );
      return;
    } catch (err) {
      console.warn("Firestore saveMapPlanets error, saving locally:", err);
    }
  }

  // Fallback
  const maps = getLocalItem<Record<string, MapState>>(LS_MAPS, {});
  const current = maps[campaignId] || { planets: [], troops: [], updatedAt: now };
  const updatedState: MapState = { ...current, planets, updatedAt: now };
  maps[campaignId] = updatedState;
  setLocalItem(LS_MAPS, maps);

  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_map_planets",
        payload: { campaignId, planets: sanitized },
      }),
    });
  } catch {}

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const bc = new BroadcastChannel(`sss_map_${campaignId}`);
    bc.postMessage(updatedState);
    bc.close();
  }
}

// ============================================================================
// MODULE 4: PLAYER CHARACTER SHEET & DASHBOARD PERSISTENCE
// ============================================================================
function getCharacterDocKey(campaignId: string, username: string): string {
  return `${campaignId}_${username.trim().toLowerCase()}`;
}

export async function getPlayerCharacter(
  campaignId: string,
  username: string
): Promise<PlayerCharacter | null> {
  const docKey = getCharacterDocKey(campaignId, username);

  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, "campaign_characters", docKey));
      if (snap.exists()) {
        return snap.data() as PlayerCharacter;
      }
      return null;
    } catch (err) {
      console.warn("Firestore getPlayerCharacter error, using fallback:", err);
    }
  }

  // Server store query
  try {
    const res = await fetch(
      `/api/store?type=character&campaignId=${encodeURIComponent(
        campaignId
      )}&username=${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.character) return data.character as PlayerCharacter;
    }
  } catch {}

  const chars = getLocalItem<Record<string, PlayerCharacter>>(LS_CHARACTERS, {});
  return chars[docKey] || null;
}

export async function savePlayerCharacter(character: PlayerCharacter): Promise<void> {
  const docKey = getCharacterDocKey(character.campaignId, character.username);
  const updatedChar: PlayerCharacter = {
    ...character,
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "campaign_characters", docKey), sanitizeForFirestore(updatedChar));
      return;
    } catch (err) {
      console.warn("Firestore savePlayerCharacter error, using fallback:", err);
    }
  }

  // Save to Server Store (shared across all browsers)
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_character",
        payload: updatedChar,
      }),
    });
  } catch {}

  // Local fallback & Broadcast
  const chars = getLocalItem<Record<string, PlayerCharacter>>(LS_CHARACTERS, {});
  chars[docKey] = updatedChar;
  setLocalItem(LS_CHARACTERS, chars);

  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const bc = new BroadcastChannel(`sss_char_${docKey}`);
    bc.postMessage(updatedChar);
    bc.close();
  }
}

export function subscribePlayerCharacter(
  campaignId: string,
  username: string,
  onUpdate: (char: PlayerCharacter | null) => void
): () => void {
  const docKey = getCharacterDocKey(campaignId, username);

  if (isFirebaseConfigured() && db) {
    try {
      const unsubscribe = onSnapshot(doc(db, "campaign_characters", docKey), (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as PlayerCharacter);
        } else {
          onUpdate(null);
        }
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Firestore subscribePlayerCharacter error, using fallback:", err);
    }
  }

  // 1. Synchronous initial dispatch from local cache (or null if empty)
  const chars = getLocalItem<Record<string, PlayerCharacter>>(LS_CHARACTERS, {});
  onUpdate(chars[docKey] || null);

  // 2. Initial load from server store
  fetch(
    `/api/store?type=character&campaignId=${encodeURIComponent(
      campaignId
    )}&username=${encodeURIComponent(username)}`
  )
    .then((r) => r.json())
    .then((data) => {
      onUpdate(data.character || null);
    })
    .catch(() => {
      const fallbackChars = getLocalItem<Record<string, PlayerCharacter>>(LS_CHARACTERS, {});
      onUpdate(fallbackChars[docKey] || null);
    });

  // 3. Cross-browser polling (2 seconds)
  const pollInterval = setInterval(() => {
    fetch(
      `/api/store?type=character&campaignId=${encodeURIComponent(
        campaignId
      )}&username=${encodeURIComponent(username)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data && "character" in data) {
          onUpdate(data.character || null);
        }
      })
      .catch(() => {});
  }, 2000);

  // 4. BroadcastChannel for same-browser multi-tab updates
  let bc: BroadcastChannel | null = null;
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    bc = new BroadcastChannel(`sss_char_${docKey}`);
    bc.onmessage = (event) => {
      if (event.data) onUpdate(event.data as PlayerCharacter);
    };
  }

  return () => {
    clearInterval(pollInterval);
    if (bc) bc.close();
  };
}

export function subscribeCampaignCharacters(
  campaignId: string,
  onUpdate: (chars: PlayerCharacter[]) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "campaign_characters"),
        where("campaignId", "==", campaignId)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const list: PlayerCharacter[] = [];
        snap.forEach((d) => list.push(d.data() as PlayerCharacter));
        onUpdate(list);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Firestore subscribeCampaignCharacters error, using fallback:", err);
    }
  }

  // Initial load from server
  fetch(`/api/store?type=campaign_characters&campaignId=${encodeURIComponent(campaignId)}`)
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data.characters)) onUpdate(data.characters);
    })
    .catch(() => {});

  // Cross-browser polling (2 seconds)
  const pollInterval = setInterval(() => {
    fetch(`/api/store?type=campaign_characters&campaignId=${encodeURIComponent(campaignId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.characters)) onUpdate(data.characters);
      })
      .catch(() => {});
  }, 2000);

  return () => {
    clearInterval(pollInterval);
  };
}

// ============================================================================
// MODULE 3 & 4: BLUEPRINT MODE BATCH WRITE (ATOMIC FIRESTORE TRANSACTIONS)
// ============================================================================
export interface BlueprintBatchPayload {
  mapState?: MapState | null;
  characters?: PlayerCharacter[];
  diplomacy?: Record<string, string> | null;
}

export async function commitBlueprintBatch(
  campaignId: string,
  payload: BlueprintBatchPayload
): Promise<void> {
  const now = Date.now();
  const preparedMapState = payload.mapState
    ? { ...payload.mapState, updatedAt: now }
    : undefined;
  const preparedCharacters = payload.characters?.map((c) => ({
    ...c,
    updatedAt: now,
  }));

  // 1. Firebase Firestore writeBatch (Atomic Transaction)
  if (isFirebaseConfigured() && db) {
    try {
      const batch = writeBatch(db);

      if (preparedMapState) {
        batch.set(doc(db, "campaign_maps", campaignId), sanitizeForFirestore(preparedMapState));
      }

      if (preparedCharacters && preparedCharacters.length > 0) {
        for (const char of preparedCharacters) {
          const docKey = getCharacterDocKey(campaignId, char.username);
          batch.set(doc(db, "campaign_characters", docKey), sanitizeForFirestore(char));
        }
      }

      if (payload.diplomacy) {
        batch.update(doc(db, "campaigns", campaignId), {
          diplomatic_relations: sanitizeForFirestore(payload.diplomacy),
        });
      }

      await batch.commit();
      return;
    } catch (err) {
      console.warn("Firestore writeBatch error, applying fallback batch:", err);
    }
  }

  // 2. Fallback: Atomic Server Store write
  try {
    const url = typeof window !== "undefined" ? "/api/store" : "http://localhost:3000/api/store";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "batch_commit",
        payload: {
          campaignId,
          mapState: preparedMapState,
          characters: preparedCharacters,
          diplomacy: payload.diplomacy,
        },
      }),
    });
  } catch (err) {
    console.warn("Server store batch_commit error, applying filesystem fallback:", err);
    // Node.js direct filesystem fallback (test runner / server runtime)
    try {
      if (typeof window === "undefined") {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), ".local_store", "db.json");
        if (fs.existsSync(filePath)) {
          const store = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (preparedMapState) store.maps[campaignId] = preparedMapState;
          if (preparedCharacters) {
            for (const char of preparedCharacters) {
              const key = `${char.campaignId}_${(char.username || "").trim().toLowerCase()}`;
              store.characters[key] = char;
            }
          }
          if (payload.diplomacy && store.campaigns[campaignId]) {
            store.campaigns[campaignId].diplomatic_relations = {
              ...(store.campaigns[campaignId].diplomatic_relations || {}),
              ...payload.diplomacy,
            };
          }
          fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
        }
      }
    } catch {}
  }

  // 3. Fallback: LocalStorage & BroadcastChannel
  if (preparedMapState) {
    const maps = getLocalItem<Record<string, MapState>>(LS_MAPS, {});
    maps[campaignId] = preparedMapState;
    setLocalItem(LS_MAPS, maps);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(`sss_map_${campaignId}`);
      bc.postMessage(preparedMapState);
      bc.close();
    }
  }

  if (preparedCharacters && preparedCharacters.length > 0) {
    const chars = getLocalItem<Record<string, PlayerCharacter>>(LS_CHARACTERS, {});
    for (const char of preparedCharacters) {
      const docKey = getCharacterDocKey(campaignId, char.username);
      chars[docKey] = char;

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`sss_char_${docKey}`);
        bc.postMessage(char);
        bc.close();
      }
    }
    setLocalItem(LS_CHARACTERS, chars);
  }

  if (payload.diplomacy) {
    const campaigns = getLocalItem<Record<string, Campaign>>(LS_CAMPAIGNS, {});
    if (campaigns[campaignId]) {
      campaigns[campaignId].diplomatic_relations = payload.diplomacy;
      setLocalItem(LS_CAMPAIGNS, campaigns);

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`sss_campaign_${campaignId}`);
        bc.postMessage(campaigns[campaignId]);
        bc.close();
      }
    }
  }
}

