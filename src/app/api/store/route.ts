import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Server storage directory and file path
const STORE_DIR = path.join(process.cwd(), ".local_store");
const STORE_FILE = path.join(STORE_DIR, "db.json");

interface ServerStore {
  users: Record<string, unknown>;
  campaigns: Record<string, unknown>;
  maps: Record<string, unknown>;
  characters: Record<string, unknown>;
}

function getStore(): ServerStore {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Server store read error, creating default:", err);
  }
  return { users: {}, campaigns: {}, maps: {}, characters: {} };
}

function saveStore(store: ServerStore): void {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Server store write error:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const store = getStore();

  if (type === "all") {
    return NextResponse.json(store);
  }

  if (type === "campaign_by_code") {
    const code = (searchParams.get("code") || "").trim().toUpperCase();
    const campaigns = Object.values(store.campaigns || {}) as Array<{
      campaignCode?: string;
    }>;
    const found = campaigns.find(
      (c) => (c.campaignCode || "").toUpperCase() === code
    );
    return NextResponse.json({ campaign: found || null });
  }

  if (type === "campaign") {
    const id = searchParams.get("id") || "";
    return NextResponse.json({ campaign: store.campaigns[id] || null });
  }

  if (type === "campaigns_for_user") {
    const username = (searchParams.get("username") || "").trim().toLowerCase();
    const all = Object.values(store.campaigns || {}) as Array<{
      gmUsername?: string;
      players?: string[];
      createdAt?: number;
    }>;
    const userCampaigns = all
      .filter(
        (c) =>
          (c.gmUsername || "").toLowerCase() === username ||
          (c.players || []).some((p) => p.toLowerCase() === username)
      )
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return NextResponse.json({ campaigns: userCampaigns });
  }

  if (type === "map") {
    const campaignId = searchParams.get("campaignId") || "";
    return NextResponse.json({ map: store.maps[campaignId] || null });
  }

  if (type === "character") {
    const campaignId = searchParams.get("campaignId") || "";
    const username = (searchParams.get("username") || "").trim().toLowerCase();
    const key = `${campaignId}_${username}`;
    return NextResponse.json({ character: store.characters[key] || null });
  }

  if (type === "campaign_characters") {
    const campaignId = searchParams.get("campaignId") || "";
    const all = Object.values(store.characters || {}) as Array<{
      campaignId?: string;
    }>;
    const list = all.filter((c) => c.campaignId === campaignId);
    return NextResponse.json({ characters: list });
  }

  if (type === "user") {
    const username = (searchParams.get("username") || "").trim().toLowerCase();
    return NextResponse.json({ user: store.users[username] || null });
  }

  return NextResponse.json({ error: "Invalid query type" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const store = getStore();

    if (action === "save_user") {
      const username = (payload.username || "").trim().toLowerCase();
      store.users[username] = payload;
      saveStore(store);
      return NextResponse.json({ success: true, user: payload });
    }

    if (action === "save_campaign") {
      store.campaigns[payload.id] = payload;
      saveStore(store);
      return NextResponse.json({ success: true, campaign: payload });
    }

    if (action === "update_campaign_diplomacy") {
      const { campaignId, relations } = payload;
      const camp = (store.campaigns[campaignId] || {}) as Record<string, unknown>;
      camp.diplomatic_relations = {
        ...((camp.diplomatic_relations as Record<string, unknown>) || {}),
        ...relations,
      };
      store.campaigns[campaignId] = camp;
      saveStore(store);
      return NextResponse.json({ success: true, campaign: camp });
    }

    if (action === "save_map") {
      const { campaignId, mapState } = payload;
      store.maps[campaignId] = mapState;
      saveStore(store);
      return NextResponse.json({ success: true, map: mapState });
    }

    if (action === "save_character") {
      const char = payload;
      const key = `${char.campaignId}_${(char.username || "").trim().toLowerCase()}`;
      store.characters[key] = char;
      saveStore(store);
      return NextResponse.json({ success: true, character: char });
    }

    if (action === "join_campaign") {
      const { campaignCode, username } = payload;
      const code = (campaignCode || "").trim().toUpperCase();
      const normUser = (username || "").trim().toLowerCase();

      const campaigns = Object.values(store.campaigns || {}) as Array<{
        id: string;
        campaignCode: string;
        gmUsername: string;
        players: string[];
      }>;
      const target = campaigns.find((c) => c.campaignCode.toUpperCase() === code);

      if (!target) {
        return NextResponse.json(
          { error: `Nenhuma campanha encontrada com o código "${code}".` },
          { status: 404 }
        );
      }

      if (!target.players) target.players = [];
      if (
        !target.players.some((p) => p.toLowerCase() === normUser) &&
        target.gmUsername.toLowerCase() !== normUser
      ) {
        target.players.push(normUser);
        store.campaigns[target.id] = target;
        saveStore(store);
      }

      return NextResponse.json({ success: true, campaign: target });
    }

    if (action === "batch_commit") {
      const { campaignId, mapState, characters, diplomacy } = payload;
      if (mapState && campaignId) {
        store.maps[campaignId] = mapState;
      }
      if (Array.isArray(characters)) {
        for (const char of characters) {
          const key = `${char.campaignId}_${(char.username || "").trim().toLowerCase()}`;
          store.characters[key] = char;
        }
      }
      if (diplomacy && campaignId) {
        const camp = (store.campaigns[campaignId] || {}) as Record<string, unknown>;
        camp.diplomatic_relations = {
          ...((camp.diplomatic_relations as Record<string, unknown>) || {}),
          ...diplomacy,
        };
        store.campaigns[campaignId] = camp;
      }
      saveStore(store);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
