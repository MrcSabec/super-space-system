import { FactionId } from "@/types/sss";

export interface FactionTrait {
  id: string;
  title: string;
  category: string;
  summary: string;
  ruleDescription: string;
}

export const FACTION_TRAITS: Record<FactionId, FactionTrait[]> = {
  federation: [
    {
      id: "fed_1",
      title: "Arquitetura Modular",
      category: "Infraestrutura",
      summary: "Postos avançados e colônias são erguidos rapidamente no setor.",
      ruleDescription:
        "Postos avançados, canteiros de mineração e colônias são construídos em metade do tempo habitual, permitindo fixação territorial rápida no sistema.",
    },
    {
      id: "fed_2",
      title: "Doutrina Cívico-Militar",
      category: "Defesa",
      summary: "População civil converte-se rapidamente em milícia defensiva durante invasões.",
      ruleDescription:
        "Se um planeta colonizado for invadido ou bloqueado por forças hostis, os civis pegam em armas automaticamente, gerando guarnições de milícia sem custo prévio de recrutamento.",
    },
    {
      id: "fed_3",
      title: "Gambiarra Tecnológica",
      category: "Engenharia",
      summary: "Integração rápida e bruta de tecnologias alienígenas ou precursoras, com alta instabilidade.",
      ruleDescription:
        "Você pode incorporar artefatos ou tecnologias capturadas imediatamente em suas frotas ou bases, obtendo efeitos poderosos com risco de sobrecarga ou instabilidade operacional.",
    },
    {
      id: "fed_4",
      title: "Decreto Presidencial",
      category: "Governo",
      summary: "Aprova medidas extremas sem perda imediata de satisfação civil.",
      ruleDescription:
        "O Presidente pode emitir um decreto emergencial para mobilização total ou racionamento sem que a Satisfação caia no turno corrente, absorvendo as consequências nos ciclos seguintes.",
    },
    {
      id: "fed_5",
      title: "Tenacidade Humana",
      category: "Resiliência",
      summary: "População suporta mais turnos em condições duras antes de se rebelar.",
      ruleDescription:
        "Suas colônias resistem a bloqueios prolongados, escassez de recursos ou privações por vários turnos antes de sofrerem quebra de lealdade ou revolta aberta.",
    },
  ],

  hegemony: [
    {
      id: "heg_1",
      title: "Fisiologia de Alta Gravidade",
      category: "Fisiologia",
      summary: "Tropas terrestres Stoneman são fisicamente avassaladoras e resistentes à pressão extrema.",
      ruleDescription:
        "Corpos pequenos, hiperdensos e imparáveis em combate corporal. Suas tropas terrestres ignoram desvantagens de gravidade pesada e esmagam guarnições convencionais.",
    },
    {
      id: "heg_2",
      title: "Engenharia de Barcas",
      category: "Frotas",
      summary: "Permite a construção de Barcas Espaciais massivas e blindadas.",
      ruleDescription:
        "Você pode construir 'Barcas Espaciais', colossos blindados que funcionam simultaneamente como fortalezas de guerra pesada e cidades-fábrica móveis.",
    },
    {
      id: "heg_3",
      title: "Mão de Obra Subjugada",
      category: "Economia",
      summary: "Utiliza prisioneiros de guerra e raças dominadas para a extração de recursos.",
      ruleDescription:
        "A economia opera com prisioneiros e povos subjugados, permitindo extração pesada sem desgastar ou arriscar a limitada população de Stonemans.",
    },
    {
      id: "heg_4",
      title: "Orgulho Dinástico",
      category: "Nobreza",
      summary: "Decisões agressivas, ataques implacáveis e conquistas aumentam a aprovação nobre.",
      ruleDescription:
        "A Nobreza Stoneman exige força. Campanhas ofensivas bem-sucedidas e atos de conquista fortalecem o prestígio imperial e a estabilidade da liderança.",
    },
    {
      id: "heg_5",
      title: "Qualidade sobre Quantidade",
      category: "Militar",
      summary: "Exércitos e megaestruturas com integridade e poder de fogo absurdamente superiores.",
      ruleDescription:
        "Cada unidade ou estrutura construída pela Hegemonia possui blindagem e letalidade incomparáveis, compensando a lentidão e a baixa taxa de reprodução de sua espécie.",
    },
  ],

  pact: [
    {
      id: "pact_1",
      title: "Anexação Cultural",
      category: "Expansão",
      summary: "Expande territórios através de emissários, rotas de comércio e influência cultural.",
      ruleDescription:
        "O Pacto pode converter planetas e colônias neutras através da diplomacia, atração cultural e laços mercantis sem disparar um único tiro de canhão.",
    },
    {
      id: "pact_2",
      title: "Conselho das Espécies",
      category: "Diplomacia",
      summary: "Facilidade extrema em formar alianças e coalizões duradouras.",
      ruleDescription:
        "Tratados diplomáticos firmados pelo Pacto Prismático são estáveis, protegidos contra quebra arbitrária e quase impossíveis de serem rompidos por sabotagem inimiga.",
    },
    {
      id: "pact_3",
      title: "Doutrina de Contenção",
      category: "Defesa",
      summary: "Foco militar em defesa absoluta com tecnologia de escudos defletores massivos.",
      ruleDescription:
        "Frotas e estações espaciais contam com matrizes de escudos superlativos que resistem a bombardeios pesados e forçam invasores a combates de desgaste prolongados.",
    },
    {
      id: "pact_4",
      title: "Economia de Coalizão",
      category: "Logística",
      summary: "Compartilhamento eficiente e rápido de recursos entre biomas diferentes.",
      ruleDescription:
        "Suas rotas redistribuem excedentes agrícolas, minerais e energéticos entre mundos com biomas distintos, ignorando penalidades logísticas comuns.",
    },
    {
      id: "pact_5",
      title: "Vínculo Plural das Espécies",
      category: "Cultura",
      summary: "Talentos multifacetados herdados das espécies que formam o Pacto.",
      ruleDescription:
        "A liderança reúne inteligência estratégica plural (Humanos, Lumini, Kaelox, Aquatis, Vesper ou IAs), permitindo adaptar bônus de honra, empatia biológica ou manobra conforme a situação.",
    },
  ],

  synthetic: [
    {
      id: "syn_1",
      title: "Coletivismo Inabalável",
      category: "Sociedade",
      summary: "A população compartilha um senso de propósito absoluto sem revoltas fúteis.",
      ruleDescription:
        "Greves, revoltas e instabilidade política por motivos triviais são inexistentes. A mente coletiva militar opera com harmonia lógica e disciplina matemática.",
    },
    {
      id: "syn_2",
      title: "Fome Energética",
      category: "Economia",
      summary: "A expansão e a sociedade dependem estritamente de geração e acúmulo de energia.",
      ruleDescription:
        "A União não consome comida ou água. Todo o seu crescimento populacional e produção econômica é impulsionado por reatores, usinas solares e mundos-bateria.",
    },
    {
      id: "syn_3",
      title: "Diplomacia do Ultimato",
      category: "Guerra",
      summary: "Ofertas comerciais pacíficas que geram justificativa de guerra imediata se recusadas.",
      ruleDescription:
        "A União oferece propostas energéticas justas; caso o alvo orgânico recuse, o Primeiro-Secretário obtém Casus Belli legítimo para tomar os recursos pela força militar.",
    },
    {
      id: "syn_4",
      title: "Autoridade Condecorada",
      category: "Liderança",
      summary: "Mobilizações de emergência e megaprojetos elevam o entusiasmo popular.",
      ruleDescription:
        "Como o governante é um herói militar consagrado pela aclamação popular, mobilizar frotas de defesa ou levantar reatores gigantes aumenta a aprovação coletiva.",
    },
    {
      id: "syn_5",
      title: "Terraformação Industrial",
      category: "Adaptação",
      summary: "Colonização de mundos estéreis, radioativos ou tóxicos sem nenhuma penalidade.",
      ruleDescription:
        "Ignora a necessidade de atmosfera respirável ou biosferas verdes. Planetas considerados inóspitos por orgânicos são convertidos rapidamente em centros fabris funcionais.",
    },
  ],

  syndicate: [
    {
      id: "syn_cred_1",
      title: "Guerra por Procuração",
      category: "Militar",
      summary: "Financia conflitos alheios e contrata frotas mercenárias sem declarar guerra oficial.",
      ruleDescription:
        "O Sindicato pode comprar frotas mercenárias de NPCs e armar terceiros para desgastar rivais, sem sujar a imagem corporativa ou assinar declarações formais de hostilidade.",
    },
    {
      id: "syn_cred_2",
      title: "Agiotagem Galáctica",
      category: "Finanças",
      summary: "Concede empréstimos de recursos com juros e cláusulas severas de confisco de ativos.",
      ruleDescription:
        "Atua como o banco do setor. Se uma facção devedora entrar em calote, o Sindicato ganha respaldo jurídico para confiscar colônias, naves ou créditos do inadimplente.",
    },
    {
      id: "syn_cred_3",
      title: "Embargo Comercial",
      category: "Mercado",
      summary: "Corta rotas de suprimento e inflaciona mercados para estrangular a economia rival.",
      ruleDescription:
        "Pode isolar um alvo do mercado galáctico, paralisando suas linhas de abastecimento e forçando rendições financeiras sem disparar um tiro militar.",
    },
    {
      id: "syn_cred_4",
      title: "Senhores da Sucata",
      category: "Recursos",
      summary: "Extração ultra-eficiente em zonas de guerra, ruínas e campos de destroços espaciais.",
      ruleDescription:
        "Transforma escombros e destruição em lucros monumentais, coletando ligas raras de naves destruídas e relíquias descartadas com margens de retorno altíssimas.",
    },
    {
      id: "syn_cred_5",
      title: "Espionagem Corporativa",
      category: "Intriga",
      summary: "Rede imbatível de informações pagas, roubo de patentes e compra de governadores.",
      ruleDescription:
        "Possui a melhor teia de inteligência da galáxia. Permite adquirir projetos tecnológicos rivais, sabotar infraestruturas alheias e subornar oficiais neutros com facilidade.",
    },
  ],

  hollow: [
    {
      id: "hol_1",
      title: "Invasão Silenciosa (Intraterra)",
      category: "Infiltração",
      summary: "Utiliza Naves-Vermes que perfuram a crosta e drenam minérios do subsolo.",
      ruleDescription:
        "Penetra planetas inimigos por baixo da terra. Pode extrair veios de minérios e tesouros de forma parasitária sem que a facção da superfície perceba de imediato.",
    },
    {
      id: "hol_2",
      title: "Frotas-Colmeia (Nomadismo)",
      category: "Sobrevivência",
      summary: "Toda a civilização e procriação habitam Naves-Mãe colossais no vácuo.",
      ruleDescription:
        "Não depende de cidades fixas no solo. Perder o controle da superfície de um planeta não paralisa o império, tornando o Enxame extremamente elusivo e resiliente.",
    },
    {
      id: "hol_3",
      title: "Fervor do Deus-Sol",
      category: "Teocracia",
      summary: "Imunidade absoluta a subornos, propaganda cultural ou descontentamento civil comum.",
      ruleDescription:
        "O Enxame é cego à diplomacia e ao luxo; sua única exigência de satisfação é o fluxo contínuo de biomassa, sacrifícios e escavações em direção ao Deus-Sol.",
    },
    {
      id: "hol_4",
      title: "Biologia Incompatível",
      category: "Fisiologia",
      summary: "Fisiologia à base de nitrogênio e amônia imune a toxinas e radiação severa.",
      ruleDescription:
        "Gases venenosos, armas químicas e biomas áridos hostis não causam desgaste às tropas, embora a colmeia não consiga consumir rações agrícolas das raças de carbono.",
    },
    {
      id: "hol_5",
      title: "Armamento Sísmico",
      category: "Destruição",
      summary: "Colapsa falhas geológicas planetárias gerando terremotos cataclísmicos.",
      ruleDescription:
        "Após drenar o núcleo ou ao se ver encurralado, o Enxame pode detonar a crosta propositalmente, destruindo cidades e escudos de qualquer exército que esteja na superfície.",
    },
  ],

  rockborn: [
    {
      id: "rock_1",
      title: "Semente Tectônica (A Capital Inevitável)",
      category: "Liderança",
      summary: "O Fragmento-Regente torna a capital inexpugnável, mas não pode evacuar o mundo.",
      ruleDescription:
        "O Regente luta como um titã de pedra defendendo o mundo-capital, tornando-o quase impenetrável; contudo, sua massa colossal impede evacuação caso o planeta caia em cerco fatal.",
    },
    {
      id: "rock_2",
      title: "Biotecnologia Cristalina",
      category: "Produção",
      summary: "Frotas e estruturas são cultivadas a partir de esporos minerais em cavernas.",
      ruleDescription:
        "Não usa fábricas siderúrgicas comuns. Suas naves e fortalezas brotam do solo em cavernas ricas em minérios, dependendo intensamente da fertilidade mineral do terreno.",
    },
    {
      id: "rock_3",
      title: "Monumentos Vivos",
      category: "Defesa",
      summary: "Corpos de quartzo e basalto naturalmente resistentes, porém de ritmo metódico.",
      ruleDescription:
        "Seu povo possui couraça mineral naturalmente impenetrável contra feixes de energia e armas cinéticas, compensando sua lentidão com solidez absoluta.",
    },
    {
      id: "rock_4",
      title: "Éditos Sísmicos",
      category: "Governo",
      summary: "Decisões demoram 1 turno para ressoar, mas tornam-se imparáveis uma vez emitidas.",
      ruleDescription:
        "Grandes decretos políticos e declarações de guerra levam tempo para ecoar pela Ressonância, mas tornam-se irreversíveis e imunes a cancelamento ou sabotagem adversária.",
    },
    {
      id: "rock_5",
      title: "Memória Geológica (O Arquivo Vivo)",
      category: "Silício",
      summary: "Absorve estilhaços de oficiais destruídos, retendo todas as suas experiências táticas.",
      ruleDescription:
        "O silício preserva dados intactos. Ao recuperar restos cristalinos de generais ou naves de elite abatidas, o Fragmento-Regente absorve todo o conhecimento tático sem perdas.",
    },
  ],

  neutral: [
    {
      id: "neu_1",
      title: "Pragmatismo de Fronteira",
      category: "Neutro",
      summary: "Sobrevivência autônoma sem lealdade cega a nenhum grande bloco.",
      ruleDescription: "Permite negociar com quaisquer partes do conflito e operar rotas mercenárias livres de taxas imperiais.",
    },
  ],
};

export function getFactionTraits(factionId: FactionId): FactionTrait[] {
  return FACTION_TRAITS[factionId] || FACTION_TRAITS.neutral;
}
