export type FactionId =
  | 'federation'
  | 'pact'
  | 'hegemony'
  | 'synthetic'
  | 'syndicate'
  | 'hollow'
  | 'rockborn'
  | 'neutral';

export interface FactionConfig {
  id: FactionId;
  name: string;
  shortName: string;
  color: string;      // Pastel Hex code
  bgGlow: string;     // Soft background glow rgba
  description: string;
  archetype: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

export type PlanetSize = 'Pequeno' | 'Médio' | 'Grande';
export type PlanetType = 'Sólido' | 'Gasoso';
export type PlanetTemperature = 'Baixa' | 'Média' | 'Alta';
export type PlanetAtmosphere = 'Respirável' | 'Tóxica' | 'Nenhuma';
export type PlanetGravity = 'Baixa' | 'Normal' | 'Alta';
export type ResourceLevel = 'Baixa' | 'Média' | 'Alta';

export interface PlanetResource {
  name: string;
  level: ResourceLevel;
}

export interface AnomalousOrbit {
  enabled: boolean;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  orbitalPhase?: number; // 0 to 360 degrees
}

export interface Planet {
  id: string;
  name: string;
  x: number;          // Relative to central star (0,0)
  y: number;          // Relative to central star (0,0)
  orbitRadius: number;// Distance to center (sqrt(x^2 + y^2))
  factionId: FactionId;
  size: PlanetSize | number;       // 'Pequeno' | 'Médio' | 'Grande' or legacy radius in map units
  type?: PlanetType;               // 'Sólido' | 'Gasoso'
  temperature?: PlanetTemperature; // 'Baixa' | 'Média' | 'Alta'
  atmosphere?: PlanetAtmosphere;   // 'Respirável' | 'Tóxica' | 'Nenhuma'
  gravity?: PlanetGravity;         // 'Baixa' | 'Normal' | 'Alta'
  resources?: PlanetResource[];    // Array de objetos { name, level }
  traits?: string[];               // ex: ['Vida Inteligente', 'Ruínas Precursoras']
  anomalousOrbit?: AnomalousOrbit; // Configuração de elipse excêntrica descentralizada
  orbitalPhase?: number;           // Posição no tracejado orbital (0° a 360°)
  notes?: string;
}

export type TroopClass =
  | 'light_infantry'
  | 'heavy_infantry'
  | 'light_vehicle'
  | 'heavy_vehicle'
  | 'elite';

export interface Troop {
  id: string;
  name: string;
  x: number;          // Relative to central star (0,0)
  y: number;          // Relative to central star (0,0)
  factionId: FactionId;
  angle?: number;     // Rotation angle in degrees (default: 0)
  notes?: string;
  troopClass?: TroopClass; // Classe da tropa
  is_airspace?: boolean;    // Flag para Unidade de Elite: true = Aéreo (Triângulo Grande), false = Terrestre (Quadrado Grande)
  payload?: number;        // Tropas embarcadas (veículos terrestres e aéreos)
  ownerId?: string;        // ID ou username do criador
  visible_to?: string[];   // Array de IDs/facções que enxergam a tropa (Fog of War)
}

export interface MapState {
  planets: Planet[];
  troops: Troop[];
  updatedAt: number;
}

export interface Campaign {
  id: string;
  campaignCode: string; // e.g. "SSS-A8F9K"
  name: string;
  gmId: string;
  gmUsername: string;
  allowedFactions: FactionId[];
  initialPlanets: number;
  players: string[];    // Array of usernames
  createdAt: number;
  diplomatic_relations?: Record<string, string>;
}

export type ResourceKey =
  | 'water'
  | 'alien_grains'
  | 'alien_fauna'
  | 'natural_polymers'
  | 'heavy_alloys'
  | 'silicate'
  | 'radioactive_material'
  | 'plasma'
  | 'stimulants';

export type ResourceStockLevel = 'vazios' | 'suficiente' | 'cheios' | 'transbordando';
export type ResourceFluxLevel = 'faltando' | 'nenhum' | 'emergente' | 'enorme';

export interface QualitativeResource {
  estoque: ResourceStockLevel;
  entrada: ResourceFluxLevel;
}

// Backward-compatibility schema for legacy character records
export interface ResourceItem {
  current?: number;
  income?: number;
  upkeep?: number;
  estoque?: ResourceStockLevel;
  entrada?: ResourceFluxLevel;
}

export interface PlayerNote {
  id: string;
  title: string;
  content: string; // HTML string rich text
  createdAt: number;
  updatedAt: number;
}

export interface PlayerCharacter {
  id: string;
  campaignId: string;
  userId: string;
  username: string;

  // Identidade Básica
  characterName: string; // Nome do Governante
  leaderTitle: string;   // Ex: Presidente, Regente, CEO, etc.
  factionId: FactionId;

  // Perfil de Liderança
  strengths: [string, string, string]; // 3 Trunfos
  weakness: string;                    // 1 Fardo

  // Os 4 Pilares do Império (O "HP" do Império: 0 a 4 - 5 Níveis com o Meio Neutro)
  satisfaction: number;     // 4: Excelente, 3: Estável, 2: Neutra, 1: Tensa, 0: Colapso
  economy: number;          // 4: Abundante, 3: Suficiente, 2: Neutra, 1: Racionamento, 0: Fome
  military: number;         // 4: Supremacia, 3: Seguro, 2: Neutro, 1: Pressionado, 0: Dizimado
  politicalRelation: number;// 4: Devoção, 3: Alinhado, 2: Neutra, 1: Desconfiança, 0: Traição/Corte

  // Módulo 4: Demografia e Forças Armadas
  populationCount?: number;
  militaryCount?: number;

  // Módulo 4: Cofre (Finanças) & Gestão Qualitativa dos 9 Recursos Físicos
  galacticCredits: number;
  resources?: Record<ResourceKey, QualitativeResource>;
  precursorArtifacts: string[];

  // Módulo 4: Centro de Comando Militar (5 Tiers Militares - Read-Only para o jogador)
  lightInfantry?: number;
  heavyInfantry?: number;
  lightVehicles?: number;
  heavyVehicles?: number;
  eliteUnits?: number;

  // Módulo 4: Bloco de Notas / Diário de Comando Multi-Aba (Rich Text)
  notes?: PlayerNote[];

  // Módulo 4: Características Gerais / Metagaming Perks (Licenças de Conhecimento)
  characteristic_points?: number; // Pontos para adquirir características (padrão inicial = 2)
  unlocked_characteristics?: string[]; // IDs das características adquiridas

  // Diário do Turno (Legado / Opcional)
  turnLog?: string;

  createdAt: number;
  updatedAt: number;
}

