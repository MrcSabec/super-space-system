import {
  FactionId,
  ResourceKey,
  QualitativeResource,
  ResourceStockLevel,
  ResourceFluxLevel,
  PlayerCharacter,
} from "@/types/sss";

export interface StockStageConfig {
  id: ResourceStockLevel;
  label: string;
  index: number;
  color: string;
  badgeBg: string;
  description: string;
}

export interface FluxStageConfig {
  id: ResourceFluxLevel;
  label: string;
  index: number;
  symbol: string;
  color: string;
  badgeBg: string;
  description: string;
}

export const STOCK_STAGES: StockStageConfig[] = [
  {
    id: "vazios",
    label: "Vazios",
    index: 0,
    color: "#ef4444",
    badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
    description: "Estoque crítico ou esgotado. Risco de fome, motim ou paralisia de frotas.",
  },
  {
    id: "suficiente",
    label: "Suficiente",
    index: 1,
    color: "#38bdf8",
    badgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    description: "Estoque operacional e estável para manter o império funcionando.",
  },
  {
    id: "cheios",
    label: "Cheios",
    index: 2,
    color: "#34d399",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    description: "Silos e entrepostos confortavelmente abastecidos para novos projetos.",
  },
  {
    id: "transbordando",
    label: "Transbordando",
    index: 3,
    color: "#c084fc",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    description: "Excedente máximo. Capacidade total de reserva e poder de barganha estelar.",
  },
];

export const FLUX_STAGES: FluxStageConfig[] = [
  {
    id: "faltando",
    label: "Faltando",
    index: 0,
    symbol: "↓",
    color: "#f43f5e",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    description: "Déficit ativo. Consumo supera a entrada de suprimentos.",
  },
  {
    id: "nenhum",
    label: "Nenhum",
    index: 1,
    symbol: "—",
    color: "#94a3b8",
    badgeBg: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    description: "Fluxo neutro. Sem novos aportes relevantes ou perdas na rota.",
  },
  {
    id: "emergente",
    label: "Emergente",
    index: 2,
    symbol: "↑",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    description: "Produção ascendente. Rotas e minerações gerando superávit.",
  },
  {
    id: "enorme",
    label: "Enorme",
    index: 3,
    symbol: "⇈",
    color: "#38bdf8",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    description: "Fluxo torrencial de suprimentos alimentando a máquina do império.",
  },
];

export interface ResourceDefinition {
  key: ResourceKey;
  name: string;
  description: string;
  category: "vital" | "industrial" | "strategic";
  iconName: string;
  badgeColor: string;
  accentColor: string;
}

export const EOS_OMEGA_RESOURCES: ResourceDefinition[] = [
  {
    key: "water",
    name: "Água",
    description:
      "O solvente universal. Essencial para manter colônias orgânicas vivas e resfriar os supercomputadores e reatores da União Sintética.",
    category: "vital",
    iconName: "Droplets",
    badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    accentColor: "#7dd3fc",
  },
  {
    key: "alien_grains",
    name: "Grãos Alienígenas",
    description:
      "O sustento básico e barato. Mantém a base da pirâmide social operando e evita revoltas por fome em mundos superpopulosos.",
    category: "vital",
    iconName: "Wheat",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    accentColor: "#fde047",
  },
  {
    key: "alien_fauna",
    name: "Fauna Alienígena",
    description:
      "Biomassa viva de alto valor. Usada para rações militares de elite ou, no caso da Terra Oca, consumida em quantidades industriais para saciar o Enxame.",
    category: "vital",
    iconName: "Bug",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    accentColor: "#86efac",
  },
  {
    key: "natural_polymers",
    name: "Polímeros Naturais",
    description:
      "Material de construção leve e flexível extraído da flora alienígena. Vital para a rápida expansão de postos avançados e infraestrutura civil.",
    category: "industrial",
    iconName: "Box",
    badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    accentColor: "#5eead4",
  },
  {
    key: "heavy_alloys",
    name: "Ligas Pesadas",
    description:
      "Titânio, tungstênio e blindagens. A espinha dorsal da guerra. Nenhuma nave de combate ou estação espacial é construída sem o domínio deste metal.",
    category: "industrial",
    iconName: "Shield",
    badgeColor: "bg-slate-400/10 text-slate-300 border-slate-400/30",
    accentColor: "#cbd5e1",
  },
  {
    key: "silicate",
    name: "Silicato",
    description:
      "Quartzo, silício e terras raras. A base da tecnologia de comunicação, chips de IAs e, fundamentalmente, o material que compõe a biologia e a reprodução dos Nascidos da Rocha.",
    category: "industrial",
    iconName: "Gem",
    badgeColor: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
    accentColor: "#f0abfc",
  },
  {
    key: "radioactive_material",
    name: "Matéria Radioativa",
    description:
      "Energia bruta, suja e estática. Abastece as colossais fábricas e cidades planetárias, sendo o recurso mais disputado pela União Sintética para manter seu povo online.",
    category: "strategic",
    iconName: "Radiation",
    badgeColor: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    accentColor: "#fdba74",
  },
  {
    key: "plasma",
    name: "Plasma",
    description:
      "O combustível volátil das estrelas. Exigido para viagens de dobra, movimentação de frotas no mapa e munição de artilharia naval pesada.",
    category: "strategic",
    iconName: "Flame",
    badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    accentColor: "#c084fc",
  },
  {
    key: "stimulants",
    name: "Estimulantes",
    description:
      "Especiarias raras, narcóticos e bens de luxo puramente sociais. Não constroem nada, mas mantêm a Nobreza e as Elites controladas, sendo a principal moeda de chantagem do Sindicato.",
    category: "strategic",
    iconName: "Sparkles",
    badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    accentColor: "#f472b6",
  },
];

export interface FactionInitialCensus {
  factionId: FactionId;
  credits: number;
  population: number;
  populationLabel?: string;
  military: number;
  militaryLabel?: string;
  cargo: Partial<Record<ResourceKey, number>>;
  specialNotes?: string;
}

export const FACTION_INITIAL_CENSUS: Record<FactionId, FactionInitialCensus> = {
  federation: {
    factionId: "federation",
    credits: 1000,
    population: 5000,
    populationLabel: "População",
    military: 1000,
    militaryLabel: "Militares",
    cargo: {
      water: 2,
      alien_grains: 2,
      natural_polymers: 2,
      heavy_alloys: 1,
      plasma: 1,
    },
  },
  pact: {
    factionId: "pact",
    credits: 1500,
    population: 6000,
    populationLabel: "População",
    military: 500,
    militaryLabel: "Militares",
    cargo: {
      water: 3,
      alien_grains: 3,
      silicate: 1,
      plasma: 1,
    },
  },
  hegemony: {
    factionId: "hegemony",
    credits: 500,
    population: 2000,
    populationLabel: "População",
    military: 2000,
    militaryLabel: "Militares",
    cargo: {
      water: 1,
      alien_grains: 1,
      heavy_alloys: 3,
      plasma: 2,
    },
    specialNotes: "Risco imediato de fome.",
  },
  synthetic: {
    factionId: "synthetic",
    credits: 1000,
    population: 8000,
    populationLabel: "População (Drones)",
    military: 1500,
    militaryLabel: "Militares",
    cargo: {
      water: 2,
      radioactive_material: 3,
      silicate: 2,
      heavy_alloys: 1,
    },
    specialNotes: "Não consomem Grãos/Fauna.",
  },
  syndicate: {
    factionId: "syndicate",
    credits: 8000,
    population: 1000,
    populationLabel: "População",
    military: 200,
    militaryLabel: "Militares (Mercenários)",
    cargo: {
      water: 1,
      alien_grains: 1,
      stimulants: 4,
      plasma: 2,
    },
  },
  hollow: {
    factionId: "hollow",
    credits: 0,
    population: 15000,
    populationLabel: "População (Enxame)",
    military: 5000,
    militaryLabel: "Militares",
    cargo: {
      alien_fauna: 4,
      water: 2,
      radioactive_material: 1,
    },
  },
  rockborn: {
    factionId: "rockborn",
    credits: 1000,
    population: 1500,
    populationLabel: "População",
    military: 800,
    militaryLabel: "Militares",
    cargo: {
      silicate: 4,
      heavy_alloys: 2,
      radioactive_material: 2,
    },
    specialNotes: "Não consomem Grãos/Fauna.",
  },
  neutral: {
    factionId: "neutral",
    credits: 1000,
    population: 3000,
    populationLabel: "População",
    military: 1000,
    militaryLabel: "Militares",
    cargo: {
      water: 2,
      alien_grains: 2,
      natural_polymers: 1,
      heavy_alloys: 1,
      plasma: 1,
    },
  },
};

export interface FactionInitialMilitaryTiers {
  lightInfantry: number;
  heavyInfantry: number;
  lightVehicles: number;
  heavyVehicles: number;
  eliteUnits: number;
  powerStatus?: string;
  overview?: string;
  flavor: {
    lightInfantry: string;
    heavyInfantry: string;
    lightVehicles: string;
    heavyVehicles: string;
    eliteUnits: string;
  };
}

export const FACTION_INITIAL_MILITARY_TIERS: Record<FactionId, FactionInitialMilitaryTiers> = {
  federation: {
    powerStatus: "Seguro",
    overview: "Eles são pau pra toda obra. Um exército equilibrado e defensivo.",
    lightInfantry: 3,
    heavyInfantry: 1,
    lightVehicles: 2,
    heavyVehicles: 1,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Milícia civil e fuzileiros",
      heavyInfantry: "Tropa de choque",
      lightVehicles: "Esquadrões de interceptação",
      heavyVehicles: "Artilharia de defesa planetária",
      eliteUnits: "Nenhuma no início",
    },
  },
  rockborn: {
    powerStatus: "Pressionado",
    overview: "Poucos números, muito lentos, mas quase indestrutíveis. A única vantagem inicial real é o próprio jogador.",
    lightInfantry: 1,
    heavyInfantry: 3,
    lightVehicles: 0,
    heavyVehicles: 1,
    eliteUnits: 1,
    flavor: {
      lightInfantry: "Agrupamentos menores de cristal",
      heavyInfantry: "Colossos guerreiros",
      lightVehicles: "Sem aeronáutica leve eficaz",
      heavyVehicles: "Cruzadores de silício",
      eliteUnits: "O Fragmento-Regente no campo de batalha",
    },
  },
  hollow: {
    powerStatus: "Seguro",
    overview: "Um pesadelo de se enfrentar no chão, movido pelo Fervor do Deus-Sol. A Nave-Mãe é o coração da frota.",
    lightInfantry: 8,
    heavyInfantry: 2,
    lightVehicles: 2,
    heavyVehicles: 0,
    eliteUnits: 1,
    flavor: {
      lightInfantry: "O Enxame puro, bilhões de insetos menores",
      heavyInfantry: "Guerreiros de carapaça pesada",
      lightVehicles: "Naves vermes batedoras",
      heavyVehicles: "Nenhum no início",
      eliteUnits: "A Colossal Nave-Mãe Nômade",
    },
  },
  syndicate: {
    powerStatus: "Dizimado",
    overview: "Chegaram para lucrar, não para lutar no começo. Dependem de dinheiro para comprar tropas urgentes.",
    lightInfantry: 1,
    heavyInfantry: 0,
    lightVehicles: 1,
    heavyVehicles: 0,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Seguranças corporativos e mercenários baratos",
      heavyInfantry: "Nenhuma tropa de choque própria",
      lightVehicles: "Escolta de cargueiros",
      heavyVehicles: "Nenhum veículo pesado próprio",
      eliteUnits: "Nenhuma no início",
    },
  },
  synthetic: {
    powerStatus: "Seguro",
    overview: "Produção em massa de máquinas, mas que gastam muita energia.",
    lightInfantry: 5,
    heavyInfantry: 1,
    lightVehicles: 3,
    heavyVehicles: 0,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Drones de combate padronizados",
      heavyInfantry: "Mechas de terraformação militarizados",
      lightVehicles: "Caças não-tripulados de altíssima velocidade",
      heavyVehicles: "Nenhum no início",
      eliteUnits: "Nenhuma no início",
    },
  },
  hegemony: {
    powerStatus: "Supremacia",
    overview: "Força esmagadora absoluta. As Barcas Espaciais são os veículos pesados, a infantaria deles quebra qualquer linha.",
    lightInfantry: 4,
    heavyInfantry: 2,
    lightVehicles: 0,
    heavyVehicles: 3,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Raças subjugadas servindo de bucha de canhão",
      heavyInfantry: "Legiões de Stonemans puro-sangue",
      lightVehicles: "Sem veículos leves (doutrina Stoneman)",
      heavyVehicles: "As massivas e lentas Barcas Espaciais",
      eliteUnits: "Nenhuma no início",
    },
  },
  pact: {
    powerStatus: "Pressionado",
    overview: "Focados na Defesa Absoluta e na Doutrina de Contenção. Eles não têm exército de invasão no Turno 0.",
    lightInfantry: 2,
    heavyInfantry: 2,
    lightVehicles: 2,
    heavyVehicles: 1,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Tropas conjuntas das espécies",
      heavyInfantry: "Batalhões de escudeiros pesados",
      lightVehicles: "Caças Vesper de alta esquiva",
      heavyVehicles: "Plataformas orbitais de escudo",
      eliteUnits: "Nenhuma no início",
    },
  },
  neutral: {
    powerStatus: "Neutro",
    overview: "Grupamentos civis e milícias planetárias neutras.",
    lightInfantry: 0,
    heavyInfantry: 0,
    lightVehicles: 0,
    heavyVehicles: 0,
    eliteUnits: 0,
    flavor: {
      lightInfantry: "Patrulhas neutras",
      heavyInfantry: "Guarda corporativa contratada",
      lightVehicles: "Sondas autônomas",
      heavyVehicles: "Fragatas de patrulha",
      eliteUnits: "Nenhuma",
    },
  },
};

/**
 * Cria a estrutura inicial qualitativa dos 9 recursos de Eos-Omega.
 * Padrão definido no design:
 * - Régua 1 (Estoque): "suficiente"
 * - Régua 2 (Entrada): "nenhum"
 */
export function createInitialResources(factionId?: FactionId): Record<ResourceKey, QualitativeResource> {
  const resources = {} as Record<ResourceKey, QualitativeResource>;

  for (const item of EOS_OMEGA_RESOURCES) {
    resources[item.key] = {
      estoque: "suficiente",
      entrada: "nenhum",
    };
  }

  return resources;
}

const VALID_STOCK: ResourceStockLevel[] = ["vazios", "suficiente", "cheios", "transbordando"];
const VALID_FLUX: ResourceFluxLevel[] = ["faltando", "nenhum", "emergente", "enorme"];

export function getStockStage(level?: ResourceStockLevel): StockStageConfig {
  return STOCK_STAGES.find((s) => s.id === level) || STOCK_STAGES[1]; // default 'suficiente'
}

export function getFluxStage(level?: ResourceFluxLevel): FluxStageConfig {
  return FLUX_STAGES.find((s) => s.id === level) || FLUX_STAGES[1]; // default 'nenhum'
}

/**
 * Garante que um PlayerCharacter tenha todos os 9 recursos qualitativos devidamente formatados.
 * Converte dados numéricos legados (current/income/upkeep) caso existam no banco sem perdas.
 */
export function normalizeCharacterResources(
  char: Partial<PlayerCharacter>,
  factionId?: FactionId
): Record<ResourceKey, QualitativeResource> {
  const initial = createInitialResources(factionId);
  if (!char.resources) return initial;

  const result = { ...initial };
  for (const item of EOS_OMEGA_RESOURCES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (char.resources as any)[item.key];
    if (existing && typeof existing === "object") {
      let estoque: ResourceStockLevel = "suficiente";
      let entrada: ResourceFluxLevel = "nenhum";

      // 1. Estoque (padrão 'suficiente' conforme diretriz)
      if (VALID_STOCK.includes(existing.estoque)) {
        estoque = existing.estoque;
      } else {
        estoque = "suficiente";
      }

      // 2. Entrada / Fluxo
      if (VALID_FLUX.includes(existing.entrada)) {
        entrada = existing.entrada;
      } else if (typeof existing.income === "number" || typeof existing.upkeep === "number") {
        const net = (existing.income || 0) - (existing.upkeep || 0);
        if (net < 0) entrada = "faltando";
        else if (net === 0) entrada = "nenhum";
        else if (net <= 2) entrada = "emergente";
        else entrada = "enorme";
      }

      result[item.key] = { estoque, entrada };
    }
  }

  return result;
}
