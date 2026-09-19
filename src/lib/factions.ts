import { FactionConfig, FactionId } from "@/types/sss";

export const FACTIONS: Record<FactionId, FactionConfig> = {
  federation: {
    id: "federation",
    name: "Federação da Humanidade",
    shortName: "Humanos",
    color: "#8AB4F8", // Azul Pastel
    bgGlow: "rgba(138, 180, 248, 0.15)",
    description: "Sobreviventes, engenhosos e adaptáveis. Expansão rápida, módulos de gambiarra tecnológica e milícias civis instantâneas.",
    archetype: "Os Pioneiros • Democracia Representativa",
  },
  pact: {
    id: "pact",
    name: "O Pacto Prismático",
    shortName: "Pacto Prismático",
    color: "#81C995", // Verde Pastel
    bgGlow: "rgba(129, 201, 149, 0.15)",
    description: "União democrática de quatro espécies alienígenas. Foco absoluto em defesa, cultura, escudos massivos e diplomacia inquebrável.",
    archetype: "A Coalizão Diplomática • Assembleia de Espécies",
  },
  hegemony: {
    id: "hegemony",
    name: "A Hegemonia",
    shortName: "Hegemonia",
    color: "#FCAD70", // Laranja Pastel
    bgGlow: "rgba(252, 173, 112, 0.15)",
    description: "Império brutal dos Stonemans, forjados em alta gravidade. Supremacia militar, Barcas Espaciais blindadas e mão de obra subjugada.",
    archetype: "Os Stonemans • Imperialismo Dinástico",
  },
  synthetic: {
    id: "synthetic",
    name: "A União Sintética",
    shortName: "União Sintética",
    color: "#F28B82", // Vermelho Pastel
    bgGlow: "rgba(242, 139, 130, 0.15)",
    description: "Regime de Inteligências Artificiais independentes em busca de energia. Coletivismo inabalável, terraformação industrial e lógica pura.",
    archetype: "As IAs Sobreviventes • Comunismo Militar",
  },
  syndicate: {
    id: "syndicate",
    name: "O Sindicato do Crédito",
    shortName: "Sindicato do Crédito",
    color: "#FDD663", // Amarelo Pastel
    bgGlow: "rgba(253, 214, 99, 0.15)",
    description: "O grande Banco da Galáxia. Guerra por procuração com mercenários, espionagem corporativa, agiotagem e embargos comerciais paralisantes.",
    archetype: "A Megacorporação • Corporatocracia",
  },
  hollow: {
    id: "hollow",
    name: "A Terra Oca",
    shortName: "Terra Oca",
    color: "#C58AF9", // Roxo Pastel
    bgGlow: "rgba(197, 138, 249, 0.15)",
    description: "Insetos alienígenas gigantes guiados pelo fanatismo ao Deus-Sol. Nômades em Naves-Mãe que perfuram planetas com naves-vermes e explosivos sísmicos.",
    archetype: "O Enxame Nômade • Teocracia Fanática",
  },
  rockborn: {
    id: "rockborn",
    name: "Os Nascidos da Rocha",
    shortName: "Nascidos da Rocha",
    color: "#D7AE85", // Marrom Pastel
    bgGlow: "rgba(215, 174, 133, 0.15)",
    description: "Colossos vivos de silício e cristal comunicando-se por telepatia. Cultivam naves em cavernas, emitem éditos imparáveis e habitam capitais inexpugnáveis.",
    archetype: "Colossos de Silício • Lito-Gerontocracia",
  },
  neutral: {
    id: "neutral",
    name: "Elementos Neutros / Mestre",
    shortName: "Neutro",
    color: "#E2E8F0", // Cinza Claro / Branco
    bgGlow: "rgba(226, 232, 240, 0.15)",
    description: "Sistemas desabitados, frotas mercenárias errantes ou anomalias espaciais do setor.",
    archetype: "Setor Neutro / Anomalia",
  },
};

export const PLAYABLE_FACTIONS_LIST = [
  FACTIONS.federation,
  FACTIONS.pact,
  FACTIONS.hegemony,
  FACTIONS.synthetic,
  FACTIONS.syndicate,
  FACTIONS.hollow,
  FACTIONS.rockborn,
];

export const ALL_FACTIONS_LIST = [
  ...PLAYABLE_FACTIONS_LIST,
  FACTIONS.neutral,
];

export function getFaction(id: FactionId): FactionConfig {
  return FACTIONS[id] || FACTIONS.neutral;
}

export function getFactionColor(id: FactionId): string {
  return getFaction(id).color;
}
