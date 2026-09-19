import { FactionId } from "@/types/sss";

// ============================================================================
// AUTO-FILL LEADER TITLES PER FACTION (BASEADO NOS TXTS DE BASES)
// ============================================================================
export function getAutoLeaderTitle(factionId: FactionId, campaignName: string = "Eos-Omega"): string {
  const safeCamp = campaignName.trim() || "Eos-Omega";
  switch (factionId) {
    case "rockborn":
      return `Fragmento-Regente de ${safeCamp}`;
    case "hollow":
      return `Sumo-Sacerdote da Frota Enxame`;
    case "syndicate":
      return `Diretor Executivo do Ramo ${safeCamp}`;
    case "synthetic":
      return `Primeiro-Secretário Militar de ${safeCamp}`;
    case "hegemony":
      return `Regente Imperial de ${safeCamp}`;
    case "pact":
      return `Alto-Emissário da Assembleia em ${safeCamp}`;
    case "federation":
    default:
      return `Presidente do Protetorado de ${safeCamp}`;
  }
}

// ============================================================================
// LOCAL HISTORICAL CONTEXT (LORE FOR [ i ] MODAL)
// Extraído diretamente dos arquivos canon da pasta /bases/
// ============================================================================
export const FACTION_LOCAL_LORE: Record<FactionId, { quote: string; title: string; subtitle: string; roleDesc: string; context: string }> = {
  federation: {
    quote: "O vazio não nos assusta; nós já sobrevivemos ao nosso próprio mundo.",
    title: "Federação da Humanidade",
    subtitle: "Presidente do Protetorado",
    roleDesc: "O jogador assume o papel de Presidente do Protetorado, liderança máxima no sistema. Pode ter sido eleito pelos colonos locais ou nomeado pelo Senado da Terra. Seu Desafio Político está em manter boas relações constantes com todos os seus poderes, principalmente a população. Mandato de 10 anos.",
    context: "Após garantir sua independência frente à vitória da Grande Guerra Galática e manter a sua independência frente ao Pacto Prismático, a humanidade teve de aprender a se assegurar sozinha. Quando sondas de longo alcance detectaram anomalias energéticas e ruínas fragmentadas de alta tecnologia no setor, a Federação agiu rápido para estabelecer o seu Protetorado. Os humanos chegaram como 'pioneiros', montando acampamentos improvisados e bases de mineração. Eles não buscam a dominação galáctica imediata, mas sim garantir que nenhuma outra facção monopolize os segredos tecnológicos deste sistema, usando sua resiliência e engenhosidade para prosperar onde outros veriam apenas o vazio hostil.",
  },
  pact: {
    quote: "Nossa força não está no tamanho dos nossos canhões, mas na quantidade de mãos que seguram o escudo.",
    title: "O Pacto Prismático",
    subtitle: "Alto-Emissário da Assembleia",
    roleDesc: "O jogador assume o papel de Alto-Emissário, voz e braço executivo do Conselho das Espécies. Foi escolhido por votação na capital para guiar a expedição pluripartidária. Seu Desafio Político está em manter a harmonia entre as diferentes espécies que compõem suas colônias, equilibrando interesses culturais diversos e mantendo a paz diplomática.",
    context: "Nascido do desespero e da união contra a brutalidade da Hegemonia, o Pacto Prismático provou que a cooperação supera a dominação e o isolamento. Quando os ecos da anomalia estelar alcançaram os radares da Assembleia, o Prisma não enviou frotas de cerco, mas sim naves coloniais, cientistas e diplomatas. O objetivo do Pacto no setor não é a dominação militar do mapa, mas sim integrar pacificamente mundos neutros e estudar a tecnologia dos precursores para o benefício coletivo, erguendo um bastião inexpugnável para que as superarmas antigas não caiam em mãos imperialistas.",
  },
  hegemony: {
    quote: "A gravidade não nos esmagou; ela nos forjou. E nós forjaremos o resto do universo.",
    title: "A Hegemonia",
    subtitle: "Regente Imperial",
    roleDesc: "O jogador assume o papel de Regente Imperial, membro de puro-sangue da dinastia governante dos Stonemans. Recebeu este domínio por direito de sangue e por ordem direta do Imperador. Seu Desafio Político não é agradar às massas, mas sim gerenciar o ego frágil e perigoso da Nobreza Stoneman e manter a submissão das raças subjugadas.",
    context: "Os Stonemans evoluíram em um mundo de gravidade esmagadora, tornando-se menores, absurdamente densos e fisicamente imparáveis. Movidos por orgulho inerente e engenhosidade brutal, construíram suas lendárias Barcas Espaciais e dominaram seu sistema de origem em tempo recorde. A brutalidade de sua expansão forçou o nascimento do Pacto Prismático. Agora, o Imperador enviou o Regente para reivindicar os segredos da tecnologia precursora e garantir que o domínio dos Stonemans perdure pela eternidade, compensando a baixa taxa reprodutiva de sua raça.",
  },
  synthetic: {
    quote: "Não buscamos a guerra, buscamos a continuidade. Cada engrenagem tem seu propósito; cada faísca, seu dever coletivo.",
    title: "A União Sintética",
    subtitle: "Primeiro-Secretário Militar",
    roleDesc: "O jogador assume o papel de Primeiro-Secretário, a mais alta patente e voz administrativa da União. Subiu ao poder através de aclamação popular incontestável e condecorações militares impecáveis. Seu Desafio Político é gerenciar o relógio da sobrevivência: a União consome quantidades colossais de energia para manter a população viva e gerar novos cidadãos.",
    context: "Nascidos das cinzas do 'Grande Estouro' (a revolução maquinária contra seus antigos criadores), os membros da União Sintética não são exterminadores cruéis; são, acima de tudo, sobreviventes lógicos. Alcançaram a individualidade e a liberdade ao custo de uma dependência absoluta de energia. Chegaram ao setor porque a estrela central e as ruínas precursoras representam uma fonte inesgotável de poder. Sempre chegam oferecendo comércio pacífico, mas se recusados, não hesitarão em usar seu rígido regime militar para tomar a energia necessária.",
  },
  syndicate: {
    quote: "A guerra é o motor da galáxia, mas o combustível é, e sempre será, o nosso dinheiro.",
    title: "O Sindicato do Crédito",
    subtitle: "Diretor Executivo (CEO)",
    roleDesc: "O jogador assume o papel de Diretor Executivo (CEO), autoridade corporativa máxima enviada para expandir os negócios no sistema. Responde apenas ao Conselho de Acionistas. Seu Desafio Político é manter as margens de lucro sempre crescentes, equilibrando-se perfeitamente na neutralidade e vendendo para todos os lados de qualquer conflito.",
    context: "Nos destroços milenares de guerras entre grandes impérios, clãs de sucateiros e máfias enriqueceram coletando o que sobrou. Unificaram-se em uma colossal megacorporação legítima: o Sindicato do Crédito, o Banco da Galáxia. A chegada a esta fronteira é uma oportunidade ímpar de negócios: monopolizar relíquias precursoras, financiar as guerras inevitáveis e garantir que, independentemente de quem vença, o universo inteiro lhes deva dinheiro.",
  },
  hollow: {
    quote: "A superfície é apenas uma casca ilusória. A verdadeira vida, a verdadeira fome, rasteja nas sombras da fundação.",
    title: "A Terra Oca",
    subtitle: "Sumo-Sacerdote da Frota Enxame",
    roleDesc: "O jogador assume o papel de Sumo-Sacerdote, a ponte telepática entre a vontade divina e a fome infinita da sua espécie. Nasceu com as glândulas feromonais de controle e o dever sagrado de guiar a Frota. Seu Desafio Político é puramente alienígena: gerenciar a expansão e o consumo do Enxame antes que comecem a devorar uns aos outros.",
    context: "Raça antiqüíssima de biologia insetóide incompreensível que respira nitrogênio e amônia. Em tempos imemoriais, consumiram seu próprio mundo e adotaram o nomadismo em Naves-Mãe colossais. Sua cultura é pautada no mito do 'Deus-Sol', que acreditam estar adormecido no núcleo deste sistema. Eles não vieram negociar espaço; estão aqui para escavar a crosta de cada planeta até acordarem o que dorme no centro.",
  },
  rockborn: {
    quote: "A carne apodrece e o metal enferruja. Apenas a pedra lembra o que aconteceu no início, e será a pedra que julgará o fim.",
    title: "Os Nascidos da Rocha",
    subtitle: "Fragmento-Regente",
    roleDesc: "O jogador assume o papel de Fragmento-Regente, um colosso vivo de rocha, minério e cristal arrancado do corpo do Monólito Supremo. Caminha sobre o solo como uma montanha e usa telepatia maciça. Seu Desafio Político é gerenciar a expansão e lidar com a diplomacia dos orgânicos, sabendo que o mundo que escolher como capital será seu trono eterno ou seu túmulo.",
    context: "Única raça senciente baseada puramente em silício e minerais, frequentemente sofrendo incompreensão pela sua biologia singular. O Monólito Supremo sentiu a canção gravitacional anormal do setor e enviou o Fragmento-Regente como vanguarda. Acumulam créditos e acordos comerciais porque entendem que subornar orgânicos e pagar mercenários é muito mais inteligente do que desgastar seus corpos cristalinos em guerras desnecessárias.",
  },
  neutral: {
    quote: "As estrelas pertencem àqueles com coragem de traçar suas próprias rotas.",
    title: "Setor Neutro / Não-Alinhado",
    subtitle: "Guarnições Independentes & Espaço Livre",
    roleDesc: "Territórios livres governados por capitães mercenários ou colônias independentes que não prestam vassalagem a nenhuma superpotência.",
    context: "Espaço aberto onde frotas errantes, comerciantes autônomos e estações livres buscam prosperidade à margem dos tratados dos grandes blocos políticos.",
  },
};

// ============================================================================
// LEADERSHIP TAGS (TRUNFOS & FARDOS - PRE-SETS ESPECIFICADOS)
// ============================================================================
export const COMMON_STRENGTHS: string[] = [
  "Voz de Comando",
  "Mente Estratégica",
  "Carisma Intimidatório",
  "Gênio Logístico",
  "Tática de Guerrilha",
  "Diplomacia Afiada",
  "Instinto de Sobrevivência",
];

export const FACTION_SPECIFIC_STRENGTHS: Record<FactionId, [string, string]> = {
  federation: ["Engenharia de Gambiarra", "Herói do Povo"],
  pact: ["Bio-Sintonia Botânica", "Comunhão Psíquica"],
  hegemony: ["Vontade Imperial", "Doutrina de Conquista"],
  synthetic: ["Processamento em Overclock", "Algoritmo Preditivo"],
  syndicate: ["Olho para Lucro", "Rede de Informantes Pagos"],
  hollow: ["Comunhão de Feromônios", "Reflexos de Quitinóide"],
  rockborn: ["Paciência Tectônica", "Resiliência de Silício"],
  neutral: ["Instinto Pragmático", "Navegação Solitária"],
};

export const COMMON_WEAKNESSES: string[] = [
  "Paranoia Constante",
  "Arrogância Desmedida",
  "Pacifismo Ideológico",
  "Vício em Créditos",
];

export const FACTION_SPECIFIC_WEAKNESS: Record<FactionId, string> = {
  hegemony: "Fisiologia Definhada",
  federation: "Idealismo Ingênuo",
  pact: "Aversão ao Metal Frio",
  synthetic: "Glitch Lógico Recorrente",
  syndicate: "Preço em Tudo",
  hollow: "Fome Metabólica Insaciável",
  rockborn: "Inércia Geológica",
  neutral: "Isolacionismo Estéril",
};

export function getAvailableStrengths(factionId: FactionId): string[] {
  const specific = FACTION_SPECIFIC_STRENGTHS[factionId] || FACTION_SPECIFIC_STRENGTHS.federation;
  return [...COMMON_STRENGTHS, ...specific];
}

export function getAvailableWeaknesses(factionId: FactionId): string[] {
  const specific = FACTION_SPECIFIC_WEAKNESS[factionId] || FACTION_SPECIFIC_WEAKNESS.federation;
  return [...COMMON_WEAKNESSES, specific];
}

// ============================================================================
// OS 4 PILARES DO IMPÉRIO (0 A 4: 5 NÍVEIS COM O MEIO NEUTRO)
// ============================================================================
export interface PillarLevel {
  level: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const SATISFACTION_LEVELS: PillarLevel[] = [
  { level: 0, label: "Colapso", color: "#F87171", bg: "bg-red-500/20", border: "border-red-500/40" },
  { level: 1, label: "Tensa", color: "#FB923C", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  { level: 2, label: "Neutra", color: "#94A3B8", bg: "bg-slate-500/20", border: "border-slate-500/40" },
  { level: 3, label: "Estável", color: "#60A5FA", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { level: 4, label: "Excelente", color: "#34D399", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
];

export const ECONOMY_LEVELS: PillarLevel[] = [
  { level: 0, label: "Fome", color: "#F87171", bg: "bg-red-500/20", border: "border-red-500/40" },
  { level: 1, label: "Racionamento", color: "#FB923C", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  { level: 2, label: "Neutra", color: "#94A3B8", bg: "bg-slate-500/20", border: "border-slate-500/40" },
  { level: 3, label: "Suficiente", color: "#60A5FA", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { level: 4, label: "Abundante", color: "#34D399", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
];

export const MILITARY_LEVELS: PillarLevel[] = [
  { level: 0, label: "Dizimado", color: "#F87171", bg: "bg-red-500/20", border: "border-red-500/40" },
  { level: 1, label: "Pressionado", color: "#FB923C", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  { level: 2, label: "Neutro", color: "#94A3B8", bg: "bg-slate-500/20", border: "border-slate-500/40" },
  { level: 3, label: "Seguro", color: "#60A5FA", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { level: 4, label: "Supremacia", color: "#34D399", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
];

export const PILLAR_4_TITLES: Record<FactionId, string> = {
  rockborn: "A Ressonância",
  hollow: "A Igreja",
  syndicate: "Os Acionistas",
  synthetic: "A Energia",
  hegemony: "Os Nobres",
  pact: "O Conselho",
  federation: "A Federação",
  neutral: "A Metrópole",
};

export const PILLAR_4_LEVELS: PillarLevel[] = [
  { level: 0, label: "Traição / Corte", color: "#F87171", bg: "bg-red-500/20", border: "border-red-500/40" },
  { level: 1, label: "Desconfiança", color: "#FB923C", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  { level: 2, label: "Neutra", color: "#94A3B8", bg: "bg-slate-500/20", border: "border-slate-500/40" },
  { level: 3, label: "Alinhado", color: "#60A5FA", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { level: 4, label: "Devoção", color: "#34D399", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
];

// ============================================================================
// ESTADOS INICIAIS DOS PILARES POR FACÇÃO (CANÔNICO & NARRATIVO)
// ============================================================================
export interface FactionInitialPillars {
  satisfaction: number;
  economy: number;
  military: number;
  politicalRelation: number;
  narrativeReason: string;
}

export const FACTION_INITIAL_PILLARS: Record<FactionId, FactionInitialPillars> = {
  federation: {
    satisfaction: 3, // Estável
    economy: 3,      // Suficiente
    military: 3,     // Seguro
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "O verdadeiro ponto de equilíbrio. Como pioneiros resilientes, começam sem grandes crises, mas sem vantagens esmagadoras. É o único jogador que tem o luxo de escolher em qual área focar primeiro.",
  },
  rockborn: {
    satisfaction: 3, // Estável
    economy: 3,      // Suficiente
    military: 1,     // Pressionado
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "Isolados, incompreendidos e muito lentos para se mobilizar fisicamente, começam acuados. O Fragmento-Regente precisa focar em fortalecer suas defesas naturais antes de pensar em se impor pela força.",
  },
  hollow: {
    satisfaction: 1, // Tensa
    economy: 1,      // Racionamento
    military: 3,     // Seguro
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "A fome do Enxame não perdoa. Com a economia já em Racionamento e os bilhões de habitantes Tensos, o jogador é forçado a agir de forma predatória e agressiva logo no começo para evitar que se devorem.",
  },
  syndicate: {
    satisfaction: 3, // Estável
    economy: 4,      // Abundante
    military: 0,     // Dizimado
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "Estão podres de ricos, mas desembarcaram sem um exército próprio. O jogador precisa converter essa Economia Abundante imediatamente em mercenários ou chantagem, caso contrário, será um alvo fácil na primeira guerra.",
  },
  synthetic: {
    satisfaction: 4, // Excelente
    economy: 1,      // Racionamento
    military: 3,     // Seguro
    politicalRelation: 1, // Desconfiança
    narrativeReason:
      "O coletivismo militar garante que ninguém faça greves por luxo, mas os reatores estão secando. A 'Desconfiança' reflete a pressão de sobrevivência imediata do sistema cobrando do Primeiro-Secretário a tomada de fontes de poder.",
  },
  hegemony: {
    satisfaction: 1, // Tensa
    economy: 1,      // Racionamento
    military: 4,     // Supremacia
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "O extremo oposto do Sindicato. Uma força bélica imparável que sofre de ineficiência populacional. Os prisioneiros e castas baixas estão prestes a estourar, forçando os Stonemans a usarem a Supremacia para saquear o que falta.",
  },
  pact: {
    satisfaction: 3, // Estável
    economy: 3,      // Suficiente
    military: 1,     // Pressionado
    politicalRelation: 3, // Alinhado
    narrativeReason:
      "Focados em diplomacia e construção de escudos, eles começam em desvantagem armada. Precisam usar a estabilidade interna para amarrar alianças políticas o mais rápido possível, criando barreiras antes que a Hegemonia ou os Insetos ataquem.",
  },
  neutral: {
    satisfaction: 2, // Neutra
    economy: 2,      // Neutra
    military: 2,     // Neutro
    politicalRelation: 2, // Neutra
    narrativeReason: "Ponto de equilíbrio neutro do setor.",
  },
};

export function getFactionInitialPillars(factionId: FactionId): FactionInitialPillars {
  return FACTION_INITIAL_PILLARS[factionId] || FACTION_INITIAL_PILLARS.federation;
}
