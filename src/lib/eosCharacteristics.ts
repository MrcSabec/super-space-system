export type CharacteristicType = "levels" | "benefits";

export interface CharacteristicLevel {
  level: string; // e.g. "Nível I", "Nível II"
  desc: string;
}

export interface CharacteristicItem {
  id: string;
  name: string;
  type: CharacteristicType;
  category: string;
  summary: string;
  levels?: CharacteristicLevel[];
  benefits?: string[];
}

export interface CharacteristicCategory {
  id: string;
  name: string;
  iconName: string;
  badgeColor: string;
  description: string;
  items: CharacteristicItem[];
}

export const EOS_CHARACTERISTICS_CATEGORIES: CharacteristicCategory[] = [
  {
    id: "militar",
    name: "Militar",
    iconName: "Swords",
    badgeColor: "rose",
    description: "Doutrinas de combate, logística bélica, engenharia de cerco e veterania operacional.",
    items: [
      {
        id: "doutrina_militar",
        name: "Doutrina Militar",
        type: "levels",
        category: "Militar",
        summary: "Interpretação estratégica de forças, defesa e ataques em escala galáctica.",
        levels: [
          { level: "Nível I", desc: "Reconhece conceitos básicos de força, defesa e ataque." },
          { level: "Nível II", desc: "Consegue estimar a capacidade militar de forças conhecidas." },
          { level: "Nível III", desc: "Identifica composição, especialização e vulnerabilidades gerais de exércitos." },
          { level: "Nível IV", desc: "Permite análises militares detalhadas de forças conhecidas." },
          { level: "Nível V", desc: "Domínio estratégico — permite interpretar batalhas, doutrinas e movimentações militares em escala galáctica." },
        ],
      },
      {
        id: "logistica_guerra",
        name: "Logística de Guerra",
        type: "benefits",
        category: "Militar",
        summary: "Otimização de linhas de suprimento e sustentabilidade de frotas em campanha.",
        benefits: [
          "Melhor movimentação de tropas e frotas.",
          "Menor impacto de campanhas prolongadas.",
          "Melhor compreensão das necessidades logísticas de uma guerra.",
          "Identificação de operações militares insustentáveis.",
        ],
      },
      {
        id: "engenharia_militar",
        name: "Engenharia Militar",
        type: "benefits",
        category: "Militar",
        summary: "Fortificações planetárias, adaptação de armamentos e sistemas defensivos.",
        benefits: [
          "Construções defensivas mais eficientes.",
          "Melhor aproveitamento de armas e equipamentos.",
          "Melhor compreensão de sistemas defensivos e ofensivos.",
          "Adaptação de tecnologias militares.",
        ],
      },
      {
        id: "veteranos_guerra",
        name: "Veteranos de Guerra",
        type: "benefits",
        category: "Militar",
        summary: "Transmissão tática de experiência, mitigando perdas e reconhecendo táticas inimigas.",
        benefits: [
          "Tropas experientes transmitem conhecimento.",
          "Redução de perdas causadas por erros táticos.",
          "Reconhecimento de padrões utilizados por inimigos conhecidos.",
          "Melhor aproveitamento de experiências em conflitos anteriores.",
        ],
      },
    ],
  },
  {
    id: "economia",
    name: "Economia",
    iconName: "Coins",
    badgeColor: "amber",
    description: "Macroeconomia interestelar, rotas de comércio, recursos estratégicos e cofres de crise.",
    items: [
      {
        id: "administracao_economica",
        name: "Administração Econômica",
        type: "levels",
        category: "Economia",
        summary: "Compreensão de fluxos, gargalos produtivos e soberania financeira de sistemas estelares.",
        levels: [
          { level: "Nível I", desc: "Compreende produção, consumo e recursos básicos." },
          { level: "Nível II", desc: "Consegue estimar a situação econômica de um território." },
          { level: "Nível III", desc: "Identifica gargalos e dependências econômicas." },
          { level: "Nível IV", desc: "Permite análises econômicas complexas." },
          { level: "Nível V", desc: "Domínio da macroeconomia interestelar." },
        ],
      },
      {
        id: "rotas_comerciais",
        name: "Rotas Comerciais",
        type: "benefits",
        category: "Economia",
        summary: "Criação de corredores logísticos lucrativos e redução de tarifas mercantis.",
        benefits: [
          "Criação de rotas comerciais.",
          "Maior eficiência no transporte de recursos.",
          "Identificação de mercados importantes.",
          "Redução dos custos de comércio.",
        ],
      },
      {
        id: "recursos_estrategicos",
        name: "Recursos Estratégicos",
        type: "benefits",
        category: "Economia",
        summary: "Prospecção e valorização de minerais raros, plasma e compostos precursores.",
        benefits: [
          "Identificação de recursos importantes em planetas.",
          "Avaliação de depósitos minerais.",
          "Identificação da importância estratégica de determinados recursos.",
          "Identificação de recursos raros ou de difícil obtenção.",
        ],
      },
      {
        id: "reserva_emergencia",
        name: "Reserva de Emergência",
        type: "benefits",
        category: "Economia",
        summary: "Armazéns de contenção de crise que amortecem bloqueios espaciais e fomes.",
        benefits: [
          "Armazenamento de recursos para crises.",
          "Redução do impacto de guerras e bloqueios.",
          "Criação de reservas estratégicas.",
          "Maior estabilidade durante períodos de escassez.",
        ],
      },
    ],
  },
  {
    id: "ciencia_tecnologia",
    name: "Ciência & Tecnologia",
    iconName: "Cpu",
    badgeColor: "sky",
    description: "Métodos investigativos, propulsão espacial, arquivos de dados e pesquisa de anomalias.",
    items: [
      {
        id: "metodo_cientifico",
        name: "Método Científico",
        type: "levels",
        category: "Ciência & Tecnologia",
        summary: "Evolução do pensamento investigativo desde análises preliminares até a fronteira cósmica.",
        levels: [
          { level: "Nível I", desc: "Conhecimento científico básico." },
          { level: "Nível II", desc: "Capacidade de analisar tecnologias conhecidas." },
          { level: "Nível III", desc: "Pesquisa e desenvolvimento organizado." },
          { level: "Nível IV", desc: "Engenharia avançada." },
          { level: "Nível V", desc: "Pesquisa científica de fronteira." },
        ],
      },
      {
        id: "engenharia_espacial",
        name: "Engenharia Espacial",
        type: "benefits",
        category: "Ciência & Tecnologia",
        summary: "Domínio de cascos de nave, motores de curvatura e sistemas de propulsão.",
        benefits: [
          "Melhor compreensão de naves.",
          "Melhorias em motores e sistemas espaciais.",
          "Manutenção mais eficiente.",
          "Adaptação de tecnologias alienígenas conhecidas.",
        ],
      },
      {
        id: "arquivos_conhecimento",
        name: "Arquivos de Conhecimento",
        type: "benefits",
        category: "Ciência & Tecnologia",
        summary: "Preservação e recuperação imediata de tecnologias e projetos ancestrais.",
        benefits: [
          "Preservação de informações descobertas.",
          "Consulta de descobertas anteriores.",
          "Prevenção da perda de conhecimentos importantes.",
          "Comparação entre tecnologias encontradas.",
        ],
      },
      {
        id: "pesquisa_anomalias",
        name: "Pesquisa de Anomalias",
        type: "benefits",
        category: "Ciência & Tecnologia",
        summary: "Investigação detalhada de emissões exóticas e hipertecnologia precursora.",
        benefits: [
          "Melhor investigação de fenômenos desconhecidos.",
          "Diferenciação entre fenômenos naturais e artificiais.",
          "Investigação de tecnologias precursoras.",
          "Análise de fenômenos incomuns.",
        ],
      },
    ],
  },
  {
    id: "inteligencia",
    name: "Inteligência",
    iconName: "Eye",
    badgeColor: "purple",
    description: "Rede de informantes, contraespionagem, decifração de planos e operações clandestinas.",
    items: [
      {
        id: "rede_informacoes",
        name: "Rede de Informações",
        type: "benefits",
        category: "Inteligência",
        summary: "Escutas clandestinas, espiões infiltrados e interceptação de movimentações suspeitas.",
        benefits: [
          "Obtenção de informações sobre outras facções.",
          "Comparação de dados conhecidos.",
          "Identificação de movimentações suspeitas.",
          "Ampliação da rede de inteligência.",
        ],
      },
      {
        id: "analise_inteligencia",
        name: "Análise de Inteligência",
        type: "levels",
        category: "Inteligência",
        summary: "Cruzamento e dedução de diretrizes secretas em nível de setor galáctico.",
        levels: [
          { level: "Nível I", desc: "Recebe informações básicas." },
          { level: "Nível II", desc: "Consegue cruzar informações." },
          { level: "Nível III", desc: "Identifica padrões." },
          { level: "Nível IV", desc: "Produz análises estratégicas." },
          { level: "Nível V", desc: "Inteligência em escala galáctica." },
        ],
      },
      {
        id: "contraespionagem",
        name: "Contraespionagem",
        type: "benefits",
        category: "Inteligência",
        summary: "Barreiras anti-infiltração e blindagem de ordens de comando contra vazamentos.",
        benefits: [
          "Detecção de infiltrações.",
          "Proteção de informações estratégicas.",
          "Identificação de operações clandestinas.",
          "Redução de vazamentos de informações.",
        ],
      },
      {
        id: "operacoes_secretas",
        name: "Operações Secretas",
        type: "benefits",
        category: "Inteligência",
        summary: "Diretrizes pretas: sabotagem de infraestrutura, assassinato político e furto de dados.",
        benefits: [
          "Espionagem ativa.",
          "Sabotagem operacional.",
          "Infiltração de agentes.",
          "Roubo de informações e projetos.",
          "Execução de operações clandestinas profundas.",
        ],
      },
    ],
  },
  {
    id: "diplomacia",
    name: "Diplomacia",
    iconName: "Handshake",
    badgeColor: "emerald",
    description: "Protocolos de primeiro contato, mediação de disputas, pactos e grande estadismo.",
    items: [
      {
        id: "protocolo_interestelar",
        name: "Protocolo Interestelar",
        type: "benefits",
        category: "Diplomacia",
        summary: "Regras de etiqueta cósmica e neutralização de ofensas e choques culturais.",
        benefits: [
          "Facilita negociações diretas.",
          "Compreensão de protocolos de outras civilizações.",
          "Redução de conflitos culturais.",
          "Melhor comunicação diplomática.",
        ],
      },
      {
        id: "relacoes_diplomaticas_skill",
        name: "Relações Diplomáticas",
        type: "levels",
        category: "Diplomacia",
        summary: "Capacidade institucional para costurar desde contatos simples até confederações estelares.",
        levels: [
          { level: "Nível I", desc: "Contatos básicos e canais de emissários." },
          { level: "Nível II", desc: "Tratados simples de trânsito e cooperação." },
          { level: "Nível III", desc: "Alianças formais e embaixadas bilaterais." },
          { level: "Nível IV", desc: "Diplomacia multilateral e blocos de poder." },
          { level: "Nível V", desc: "Grande diplomacia interestelar e hegemonia política." },
        ],
      },
      {
        id: "reputacao",
        name: "Reputação",
        type: "benefits",
        category: "Diplomacia",
        summary: "Capital moral e prestígio cósmico que ampliam a influência de cada decreto.",
        benefits: [
          "Ações passadas influenciam positivamente relações futuras.",
          "Aumenta o reconhecimento diplomático perante o setor.",
          "Facilita negociações e concessões de outras facções.",
          "Consolida a imagem de integridade e força da civilização.",
        ],
      },
      {
        id: "tratados_acordos",
        name: "Tratados e Acordos",
        type: "benefits",
        category: "Diplomacia",
        summary: "Formalização de documentos vinculantes de não-agressão, partilhas e cooperação mútua.",
        benefits: [
          "Tratados comerciais tarifários.",
          "Pactos formais de não agressão.",
          "Alianças militares e defesa mútua.",
          "Acordos de cooperação científica compartilhada.",
          "Divisão negociada de territórios e recursos orbitais.",
        ],
      },
    ],
  },
  {
    id: "colonizacao",
    name: "Colonização",
    iconName: "Building2",
    badgeColor: "amber",
    description: "Construção de assentamentos, adaptação biosférica, megaprojetos e infraestrutura pesada.",
    items: [
      {
        id: "engenharia_colonial",
        name: "Engenharia Colonial",
        type: "benefits",
        category: "Colonização",
        summary: "Edificação acelerada de domos habitacionais e centros urbanos pioneiros.",
        benefits: [
          "Colônias construídas com maior rapidez.",
          "Melhor aproveitamento dos recursos minerais e agrícolas locais.",
          "Redução de problemas e crises iniciais de assentamento.",
          "Melhor adaptação a atmosferas e gravidades hostis.",
        ],
      },
      {
        id: "habitabilidade",
        name: "Habitabilidade",
        type: "benefits",
        category: "Colonização",
        summary: "Triagem de riscos ambientais e terraformação preliminar de mundos inóspitos.",
        benefits: [
          "Avaliação precisa da adequação de planetas para colonização.",
          "Identificação precoce de riscos ambientais e biológicos.",
          "Estimativa das dificuldades de adaptação das populações.",
          "Comparação analítica entre diferentes mundos prospectados.",
        ],
      },
      {
        id: "administracao_colonial",
        name: "Administração Colonial",
        type: "benefits",
        category: "Colonização",
        summary: "Estabilidade cívica, redução de rebeldia periférica e integração de novos mundos.",
        benefits: [
          "Redução drástica da instabilidade em novos territórios.",
          "Melhor integração cultural e cívica da população.",
          "Facilitação da expansão territorial orgânica.",
          "Redução de custos e problemas burocráticos locais.",
        ],
      },
      {
        id: "megaprojetos",
        name: "Megaprojetos",
        type: "benefits",
        category: "Colonização",
        summary: "Edificações continentais e orbitais que transformam planetas inteiros em polos industriais.",
        benefits: [
          "Construção de superestruturas de escala colossal.",
          "Capacidade de engenharia para projetos intensivos em recursos.",
          "Transformação de planetas em centros hiperespecializados.",
          "Construção de obras defensivas e produtivas estratégicas.",
        ],
      },
    ],
  },
  {
    id: "exploracao",
    name: "Exploração",
    iconName: "Compass",
    badgeColor: "teal",
    description: "Mapeamento hidrográfico estelar, expedições planetárias e escavações arqueológicas.",
    items: [
      {
        id: "cartografia_estelar",
        name: "Cartografia Estelar",
        type: "levels",
        category: "Exploração",
        summary: "Levantamento trigonométrico de rotas hiperespaciais e pontos de salto no vácuo.",
        levels: [
          { level: "Nível I", desc: "Mapeamento básico de órbitas primárias." },
          { level: "Nível II", desc: "Mapeamento de rotas e corredores conhecidos." },
          { level: "Nível III", desc: "Cartografia de regiões inteiras do setor estelar." },
          { level: "Nível IV", desc: "Mapeamento estratégico com anomalias de navegação." },
          { level: "Nível V", desc: "Cartografia profunda e irrestrita de todo o sistema." },
        ],
      },
      {
        id: "exploracao_planetaria",
        name: "Exploração Planetária",
        type: "benefits",
        category: "Exploração",
        summary: "Varreduras de superfície, identificação de bacias de recursos e xenoespécies.",
        benefits: [
          "Identificação precisa de características geológicas.",
          "Exploração expedicionária mais veloz e segura.",
          "Descoberta de depósitos ocultos de recursos.",
          "Identificação de sinais artificiais na superfície.",
          "Investigação biológica de novas formas de vida.",
        ],
      },
      {
        id: "deteccao_anomalias",
        name: "Detecção de Anomalias",
        type: "benefits",
        category: "Exploração",
        summary: "Identificação de sinais fora de padrão, ruínas sob solo e assinaturas desconhecidas.",
        benefits: [
          "Identificação de fenômenos eletromagnéticos fora do padrão.",
          "Investigação científica de sinais desconhecidos.",
          "Detecção de estruturas artificiais subterrâneas ou ocultas.",
          "Identificação precoce de ameaças xeno não catalogadas.",
        ],
      },
      {
        id: "arqueologia_galactica",
        name: "Arqueologia Galáctica",
        type: "benefits",
        category: "Exploração",
        summary: "Descoberta, catalogação e reativação segura de ruínas e tecnologias precursoras.",
        benefits: [
          "Investigação arqueológica de ruínas ancestrais.",
          "Recuperação e engenharia reversa de tecnologias antigas.",
          "Interpretação e tradução de artefatos enigmáticos.",
          "Reconstrução de eventos históricos da galáxia antiga.",
          "Preservação de relíquias de valor incalculável.",
        ],
      },
    ],
  },
  {
    id: "percepcao_informacao",
    name: "Percepção e Informação",
    iconName: "Radio",
    badgeColor: "cyan",
    description: "Observação tática do mapa, comunicação criptografada e decodificação alienígena.",
    items: [
      {
        id: "observacao_estrategica",
        name: "Observação Estratégica",
        type: "benefits",
        category: "Percepção e Informação",
        summary: "Visão analítica superior do mapa, antecipando frotas e intenções estratégicas.",
        benefits: [
          "Melhor interpretação das movimentações no mapa estelar.",
          "Identificação imediata de concentrações e mobilizações de frotas.",
          "Percepção de alterações anormais em territórios fronteiriços.",
          "Diferenciação clara entre expansão civil, comércio e preparação militar.",
        ],
      },
      {
        id: "comunicacao_interestelar",
        name: "Comunicação Interestelar",
        type: "benefits",
        category: "Percepção e Informação",
        summary: "Redes taquiônicas velozes e invioláveis conectando colônias a distâncias interestelares.",
        benefits: [
          "Comunicação mais rápida, estável e segura entre mundos.",
          "Redução substancial do risco de interceptação por escutas.",
          "Coordenação tática simultânea entre colônias distantes.",
          "Comunicação eficiente mesmo sob tempestades eletromagnéticas.",
        ],
      },
      {
        id: "decodificacao",
        name: "Decodificação",
        type: "benefits",
        category: "Percepção e Informação",
        summary: "Criptoanálise de xeno-transmissões, quebra de cifras e decifração de dialetos esquecidos.",
        benefits: [
          "Interpretação e tradução de linguagens cósmicas desconhecidas.",
          "Análise e filtragem de transmissões alienígenas abertas e cifradas.",
          "Decodificação de mensagens criptografadas militares.",
          "Identificação de padrões matemáticos e assinaturas de transmissão.",
        ],
      },
    ],
  },
];

// Helper functions for easy lookup
export function getAllCharacteristics(): CharacteristicItem[] {
  return EOS_CHARACTERISTICS_CATEGORIES.flatMap((c) => c.items);
}

export function getCharacteristicById(id: string): CharacteristicItem | undefined {
  return getAllCharacteristics().find((item) => item.id === id);
}

export const TOTAL_CHARACTERISTICS_COUNT = getAllCharacteristics().length;

export const ROMAN_LEVELS = ["I", "II", "III", "IV", "V"] as const;

/**
 * Helper to get the level key stored in unlocked_characteristics
 * e.g. "doutrina_militar_lvl1"
 */
export function getLevelKey(charId: string, levelNum: number): string {
  return `${charId}_lvl${levelNum}`;
}

/**
 * Returns the highest unlocked level (0 to 5) for a level-based characteristic
 */
export function getCharacteristicLevel(
  unlockedList: string[] | undefined,
  charId: string
): number {
  if (!unlockedList || unlockedList.length === 0) return 0;
  let highest = 0;
  for (let i = 1; i <= 5; i++) {
    if (
      unlockedList.includes(`${charId}_lvl${i}`) ||
      unlockedList.includes(`${charId}_${i}`)
    ) {
      highest = Math.max(highest, i);
    }
  }
  // Backwards compatibility: if un-suffixed base ID is in the list, count as at least Level 1
  if (highest === 0 && unlockedList.includes(charId)) {
    return 1;
  }
  return highest;
}

/**
 * Check if a specific level (1 to 5) of a characteristic is unlocked
 */
export function isLevelUnlocked(
  unlockedList: string[] | undefined,
  charId: string,
  levelNum: number
): boolean {
  return getCharacteristicLevel(unlockedList, charId) >= levelNum;
}

/**
 * Check if a characteristic has any active unlock (for benefits: in list; for levels: level >= 1)
 */
export function isCharacteristicUnlocked(
  unlockedList: string[] | undefined,
  charId: string
): boolean {
  if (!unlockedList || unlockedList.length === 0) return false;
  if (unlockedList.includes(charId)) return true;
  return getCharacteristicLevel(unlockedList, charId) > 0;
}

/**
 * Sets or updates the level of a characteristic in the unlockedList.
 * If targetLevel === 0, removes all levels and base ID.
 * If targetLevel > 0, ensures levels 1..targetLevel are included, and removes any levels > targetLevel.
 */
export function setCharacteristicLevelInList(
  unlockedList: string[] | undefined,
  charId: string,
  targetLevel: number
): string[] {
  const current = unlockedList ? [...unlockedList] : [];
  // Remove any existing keys for this charId (including base charId and charId_lvlX and charId_X)
  const cleaned = current.filter(
    (id) =>
      id !== charId &&
      !id.startsWith(`${charId}_lvl`) &&
      !id.startsWith(`${charId}_`)
  );
  if (targetLevel <= 0) {
    return cleaned;
  }
  const maxLvl = Math.min(5, Math.max(1, targetLevel));
  for (let i = 1; i <= maxLvl; i++) {
    cleaned.push(getLevelKey(charId, i));
  }
  return cleaned;
}

/**
 * Count how many distinct characteristics have been unlocked (at least level 1 or benefit active)
 */
export function countUnlockedCharacteristics(
  unlockedList: string[] | undefined
): number {
  if (!unlockedList || unlockedList.length === 0) return 0;
  const all = getAllCharacteristics();
  let count = 0;
  for (const item of all) {
    if (item.type === "levels") {
      if (getCharacteristicLevel(unlockedList, item.id) > 0) count++;
    } else {
      if (unlockedList.includes(item.id)) count++;
    }
  }
  return count;
}

/**
 * Total purchased points / ranks (each level counts 1, each benefit counts 1)
 */
export function countTotalPurchasedRanks(
  unlockedList: string[] | undefined
): number {
  if (!unlockedList || unlockedList.length === 0) return 0;
  const all = getAllCharacteristics();
  let ranks = 0;
  for (const item of all) {
    if (item.type === "levels") {
      ranks += getCharacteristicLevel(unlockedList, item.id);
    } else {
      if (unlockedList.includes(item.id)) ranks += 1;
    }
  }
  return ranks;
}
