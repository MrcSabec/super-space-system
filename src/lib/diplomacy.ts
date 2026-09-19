import { FactionId } from "@/types/sss";
import { PLAYABLE_FACTIONS_LIST } from "@/lib/factions";

export type DiplomaticStatus = "Aliados" | "Neutros" | "Tensão" | "Guerra Aberta";

export const DIPLOMATIC_STATUSES: DiplomaticStatus[] = [
  "Aliados",
  "Neutros",
  "Tensão",
  "Guerra Aberta",
];

export interface DiplomaticStatusConfig {
  id: DiplomaticStatus;
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export const DIPLOMATIC_STATUS_CONFIG: Record<DiplomaticStatus, DiplomaticStatusConfig> = {
  Aliados: {
    id: "Aliados",
    label: "Aliados",
    // Verde pastel com texto escuro
    badgeClass: "bg-emerald-200 text-emerald-950 font-bold border border-emerald-300 shadow-sm",
    dotColor: "#059669",
    description: "Pacto de cooperação mútua e trânsito pacífico.",
  },
  Neutros: {
    id: "Neutros",
    label: "Neutros",
    // Cinza / translúcido com texto branco
    badgeClass: "bg-slate-800/80 text-slate-200 border border-slate-700/80 font-medium",
    dotColor: "#94a3b8",
    description: "Relação formal sem acordos defensivos ou agressões ativas.",
  },
  Tensão: {
    id: "Tensão",
    label: "Tensão",
    // Laranja pastel com texto escuro
    badgeClass: "bg-amber-200 text-amber-950 font-bold border border-amber-300 shadow-sm",
    dotColor: "#d97706",
    description: "Atritos territoriais, sanções e risco iminente de conflito.",
  },
  "Guerra Aberta": {
    id: "Guerra Aberta",
    label: "Guerra Aberta",
    // Fundo vermelho escuro com texto branco
    badgeClass: "bg-rose-950 text-rose-100 font-bold border border-rose-600 shadow-sm",
    dotColor: "#e11d48",
    description: "Hostilidades armadas declaradas e confronto militar total.",
  },
};

/**
 * Normaliza e gera a chave canônica alfabeticamente ordenada para o par de facções.
 * Exemplo: ['hegemony', 'federation'] -> 'federation_hegemony'
 */
export function getDiplomaticPairKey(factionA: FactionId, factionB: FactionId): string {
  const sorted = [factionA.toLowerCase(), factionB.toLowerCase()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Mapeamento de apelidos e nomes para matching flexível caso o mestre use termos em PT-BR
 */
const FACTION_ALIASES: Record<FactionId, string[]> = {
  federation: ["federation", "humanos", "humano", "humanidade", "fed"],
  pact: ["pact", "pacto", "pactoprismatico", "prismatico", "prismático"],
  hegemony: ["hegemony", "hegemonia", "stonemans"],
  synthetic: ["synthetic", "sintetica", "sintética", "sinteticos", "sintéticos", "ia"],
  syndicate: ["syndicate", "sindicato", "credito", "crédito"],
  hollow: ["hollow", "terra-oca", "terra_oca", "terraoca", "oca"],
  rockborn: ["rockborn", "nascidos", "rocha", "nascidos_da_rocha", "cristal"],
  neutral: ["neutral", "neutro"],
};

/**
 * Busca o status diplomático mútuo entre duas facções.
 * Realiza matching exato pela chave canônica alfabética e, se não encontrar,
 * verifica variações e aliases. Padrão se não configurado: 'Neutros'.
 */
export function getDiplomaticStatus(
  relations: Record<string, string> | undefined,
  factionA: FactionId,
  factionB: FactionId
): DiplomaticStatus {
  if (!relations) return "Neutros";

  // 1. Match canônico direto (idA_idB ordenado)
  const canonicalKey = getDiplomaticPairKey(factionA, factionB);
  if (relations[canonicalKey]) {
    return normalizeDiplomaticStatus(relations[canonicalKey]);
  }

  // 2. Match inverso simples
  const reverseKey = `${factionB}_${factionA}`;
  if (relations[reverseKey]) {
    return normalizeDiplomaticStatus(relations[reverseKey]);
  }

  // 3. Match flexível via aliases (ex: "hegemonia_humanos")
  const aliasesA = FACTION_ALIASES[factionA] || [factionA];
  const aliasesB = FACTION_ALIASES[factionB] || [factionB];

  for (const [key, val] of Object.entries(relations)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const matchesA = aliasesA.some((a) => normKey.includes(a));
    const matchesB = aliasesB.some((b) => normKey.includes(b));
    if (matchesA && matchesB) {
      return normalizeDiplomaticStatus(val);
    }
  }

  return "Neutros";
}

/**
 * Normaliza qualquer valor textual para o DiplomaticStatus válido
 */
export function normalizeDiplomaticStatus(value?: string): DiplomaticStatus {
  if (!value) return "Neutros";
  const lower = value.trim().toLowerCase();
  if (lower.includes("aliad")) return "Aliados";
  if (lower.includes("tensa") || lower.includes("tensão")) return "Tensão";
  if (lower.includes("guerra")) return "Guerra Aberta";
  return "Neutros";
}

/**
 * Retorna a lista das outras 6 facções jogáveis (excluindo a própria facção informada)
 */
export function getOtherPlayableFactions(myFactionId: FactionId) {
  return PLAYABLE_FACTIONS_LIST.filter((f) => f.id !== myFactionId);
}
