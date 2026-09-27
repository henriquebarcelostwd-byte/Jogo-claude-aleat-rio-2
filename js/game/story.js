/* PELEJA — a história: falantes, falas, capítulos, cenas, pelejas, versos */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Au = G.Audio;
  const T = G.TILE;

  const S = () => G.state;
  const F = () => G.state.flags;

  // ==================================================================
  // FALANTES
  // ==================================================================
  const speakers = {
    zab: { name: 'Zabelê', side: 'left', voice: { type: 'triangle', base: 540, var: 0.18, vol: 0.09 } },
    nan: { name: 'Seu Nanquim', voice: { type: 'square', base: 250, var: 0.1, vol: 0.05 } },
    sab: { name: 'Cego Sabiá', voice: { type: 'sine', base: 210, var: 0.12, vol: 0.12 } },
    filo: { name: 'Dona Filó', voice: { type: 'triangle', base: 450, var: 0.3, vol: 0.09 } },
    can: { name: 'Vovó Candinha', voice: { type: 'sine', base: 400, var: 0.2, vol: 0.1 } },
    vir: { name: 'Seu Vírgula', voice: { type: 'sine', base: 300, var: 0.05, vol: 0.1 } },
    ze: { name: 'Zé Pipoco', voice: { type: 'square', base: 640, var: 0.3, vol: 0.05 } },
    tiao: { name: 'Tião Vaqueiro', voice: { type: 'triangle', base: 190, var: 0.08, vol: 0.12 } },
    tete: { name: 'Tetê', voice: { type: 'triangle', base: 580, var: 0.2, vol: 0.08 } },
    lala: { name: 'Lalá', voice: { type: 'sine', base: 470, var: 0.12, vol: 0.1 } },
    anz: { name: 'Seu Anzol', voice: { type: 'triangle', base: 260, var: 0.25, vol: 0.1 } },
    biu: { name: 'Biu', voice: { type: 'square', base: 300, var: 0.1, vol: 0.05 } },
    juca: { name: 'Juca Manchete', voice: { type: 'square', base: 520, var: 0.35, vol: 0.05 } },
    zef: { name: 'Dona Zefinha', voice: { type: 'triangle', base: 380, var: 0.2, vol: 0.09 } },
    fir: { name: 'Mestre Firmino', voice: { type: 'sine', base: 230, var: 0.1, vol: 0.11 } },
    firJ: { name: 'Firmino', memory: true, voice: { type: 'sine', base: 260, var: 0.1, vol: 0.1 } },
    luz: { name: 'Luzia', memory: true, voice: { type: 'sine', base: 520, var: 0.15, vol: 0.1 } },
    man: { name: 'Capitão Mandacaru', voice: { type: 'sawtooth', base: 140, var: 0.15, vol: 0.05 } },
    manC: { name: 'Capitão Mandacaru', voice: { type: 'sawtooth', base: 120, var: 0.2, vol: 0.05 } },
    ren: { name: 'Dona Renda', voice: { type: 'sine', base: 620, var: 0.1, vol: 0.09 } },
    renC: { name: 'Dona Renda', voice: { type: 'sine', base: 560, var: 0.3, vol: 0.09 } },
    cor: { name: 'Coronel Papelão', voice: { type: 'sawtooth', base: 170, var: 0.2, vol: 0.05 } },
    tra: { name: 'A Traça', voice: { type: 'sawtooth', base: 90, var: 0.5, vol: 0.05 } },
    lor: { name: 'Lorota', voice: { type: 'sawtooth', base: 480, var: 0.3, vol: 0.04 } },
    moca: { name: 'Moça da Feira', voice: { type: 'triangle', base: 560, var: 0.2, vol: 0.08 } },
    vend: { name: 'Vendedor', voice: { type: 'triangle', base: 300, var: 0.2, vol: 0.08 } },
    meni: { name: 'Menino', voice: { type: 'square', base: 680, var: 0.2, vol: 0.05 } },
    narr: { name: '', voice: null },
  };

  const abilities = {
    stamp: { name: 'Carimbo', key: 'stamp', desc: 'Molhe a mão na tinta do Seu Nanquim e bata no chão: uma onda de choque que atordoa inimigos, quebra rochas rachadas e desfaz nós. Gasta tinta — que volta aos pouquinhos e ao acertar golpes.' },
    throw: { name: 'Pregador de Mira', key: 'throw', desc: 'Arremesse pregadores de roupa na direção em que você olha. Acerta sinos distantes, escudos de bilro e inimigos do outro lado da água.' },
    renda: { name: 'Linha de Renda', key: 'attack', desc: 'A Dona Renda trançou sua melhor linha no seu cordão: o Chicote de Cordel agora alcança mais longe. (E você ganhou mais um coração!)' },
  };

  // ==================================================================
  // OS VERSOS PERDIDOS — "O Sol de Papel", poema de Firmino para Luzia
  // ==================================================================
  const verses = {
    1: { where: 'Vila Rima', lines: ['Luzia, quando tu rias,', 'a janela amanhecia;', 'eu nem precisava sol,', 'que o teu riso já acendia.'] },
    2: { where: 'Lajedo dos Calangos', lines: ['Recortei um sol de papel', 'pra enfeitar nossa varanda;', 'tu disseste: "Ô Firmino,', 'luz de verdade é a que anda."'] },
    3: { where: 'Portão das Letras', lines: ['Anda no pé do vaqueiro,', 'anda na asa do carcará,', 'anda na boca do povo', 'quando tem verso pra cantar.'] },
    4: { where: 'Ilha das Teias', lines: ['Quando a doença chegou,', 'tu pediste, com carinho:', '"Não me deixa no escuro,', 'me escreve num versinho."'] },
    5: { where: 'Tetê e Lalá', lines: ['E eu, besta, prometi', 'e não soube cumprir:', 'toda rima que eu achava', 'parecia te ferir.'] },
    6: { where: 'Beco das Caixas', lines: ['Amassei cem folhas brancas,', 'cada uma um dia sem ti;', 'e as folhas, de tão sozinhas,', 'criaram asas por aí.'] },
    7: { where: 'Arquivo do Coronel', lines: ['Se um dia alguém achar', 'este verso que perdi,', 'saiba que a dor tem fome', 'de tudo que já vivi.'] },
    8: { where: 'Página da Varanda', lines: ['Mas a fome de uma traça', 'é só fome de clarão:', 'quem come o sol por saudade', 'só quer luz no coração.'] },
    9: { where: 'Página do Último São João', lines: ['Então que a saudade voe,', 'que suba e vire alvorada:', 'Luzia, tu és o sol', 'e eu, a vírgula da estrada.'] },
  };

  const CH = {
    prologo: { num: 'PRÓLOGO', name: 'A Feira de Vila Rima', map: 'vila', next: 'cap1' },
    cap1: { num: 'CAPÍTULO I', name: 'O Sertão das Letras Soltas', map: 'sertao', next: 'cap2' },
    cap2: { num: 'CAPÍTULO II', name: 'O Açude das Rendas', map: 'acude', next: 'cap3' },
    cap3: { num: 'CAPÍTULO III', name: 'A Cidade de Papelão', map: 'cidade', next: 'final' },
    final: { num: 'CAPÍTULO FINAL', name: 'A Margem', map: 'margem', next: null },
  };

  const people = {
    zab: 'Vendedora de folhetos da feira de Vila Rima. Página três. Chapéu de couro, trança com fita vermelha e um cordão que estala como chicote.',
    nan: 'Tinteiro oficial do Mestre Firmino. Cristal da Boêmia, monóculo e muita opinião. Ranzinza por fora, tinta mole por dentro.',
    sab: 'Cantador cego que só fala em verso. Enxerga pelos ouvidos e pelo sabiá que mora no chapéu.',
    filo: 'Comerciante da feira. Vende folheto, rapadura, remendo e conselho — tudo com desconto pra quem pede com jeito.',
    can: 'A avó de todo mundo em Vila Rima. Conhece as lendas do Poeta e fuma um cachimbo que cheira a cravo.',
    vir: 'Ninguém sabe de onde vem. Fala, com, pausas. Aparece, onde, precisa.',
    ze: 'Menino dos rojões. Dono da cabrita Bodinha e de uma coragem maior que ele.',
    tiao: 'Vaqueiro de poucas palavras que guarda o Pouso do sertão.',
    tete: 'Rendeira alta e ligeira. Começa as frases que a irmã termina.',
    lala: 'Rendeira baixinha e sonhadora. Termina as frases que a irmã começa.',
    anz: 'Pescador do Açude. Nunca pegou um peixe menor que "deste tamanho".',
    biu: 'Jagunço de papelão que sonha em ser figurante de novela.',
    juca: 'Jornaleiro da Cidade de Papelão. Grita manchetes que ainda nem aconteceram.',
    zef: 'Padeira que faz pão de papel e se recusa a elogiar o Coronel.',
    fir: 'O Poeta. Escreveu o Sertão de Papel verso por verso — até o dia em que perdeu a rima.',
    luz: 'Luzia. A luz de Firmino. Existe agora só em tinta vermelha, nas lembranças.',
    man: 'Cangaceiro-cacto, o maior repentista da caatinga. Quando floresce, é sinal de chuva.',
    ren: 'A rendeira das mil agulhas. Teceu o céu do Açude para esconder a luz da Traça.',
    cor: 'Dono de tudo que tem carimbo. Feito de caixa, bigode e insegurança.',
    tra: 'Mariposa gigante nascida de cem rascunhos amassados. Comeu o sol. Tem um olho de gente.',
  };

  // ==================================================================
  // PELEJAS
  // ==================================================================
  const RIMAS = {
    'ÃO': ['sertão', 'coração', 'feijão', 'baião', 'trovão', 'gibão', 'pilão', 'lampião', 'canção', 'chão', 'mão', 'verão', 'violão', 'facão', 'clarão', 'algodão', 'balão', 'irmão', 'razão', 'devoção'],
    'OR': ['flor', 'amor', 'calor', 'cantor', 'tambor', 'vapor', 'doutor', 'valor', 'sabor', 'dor', 'cor', 'pavor', 'senhor', 'rumor', 'fulgor', 'tremor'],
    'ADA': ['estrada', 'madrugada', 'jornada', 'enxada', 'cocada', 'toada', 'boiada', 'alvorada', 'pisada', 'calçada', 'chegada', 'laçada', 'emboscada', 'bordada'],
    'EIRA': ['fogueira', 'poeira', 'rendeira', 'bandeira', 'ladeira', 'cachoeira', 'feira', 'zoeira', 'porteira', 'peixeira', 'goteira', 'besteira', 'ribeira', 'soleira'],
    'INHO': ['caminho', 'passarinho', 'espinho', 'carinho', 'sozinho', 'moinho', 'vizinho', 'ninho', 'pertinho', 'cantinho', 'redemoinho', 'linho'],
    'AR': ['luar', 'mar', 'cantar', 'sonhar', 'lugar', 'olhar', 'altar', 'voar', 'pomar', 'rimar', 'brilhar', 'versejar', 'clarear', 'lembrar'],
    'ENTE': ['gente', 'valente', 'semente', 'quente', 'repente', 'serpente', 'dente', 'corrente', 'poente', 'presente', 'contente', 'nascente'],
    'ELA': ['janela', 'panela', 'estrela', 'vela', 'donzela', 'cancela', 'tela', 'singela', 'aquarela', 'capela', 'fivela', 'sentinela'],
    'URA': ['rapadura', 'loucura', 'altura', 'criatura', 'fartura', 'lonjura', 'doçura', 'secura', 'costura', 'ternura', 'figura', 'aventura'],
    'IA': ['poesia', 'alegria', 'fantasia', 'cantoria', 'valentia', 'agonia', 'magia', 'ventania', 'romaria', 'harmonia', 'folia', 'melodia'],
  };

  const pelejas = {
    sabia: {
      opp: 'sab', title: 'Peleja Amistosa', stage: 'feira', tutorial: true,
      rounds: [
        {
          sound: 'ÃO', bpm: 84, density: 0.5, correct: 0.55,
          opp: ['Menina, tu que é ligeira,', 'vende folheto no chão,', 'me diz se sabe rimar', 'no compasso do baião:', 'quando eu canto uma palavra,', 'tu responde no refrão!'],
          resp: ['Pois escuta, cantador,', 'que eu rimo com precisão:', 'tenho verso no bolso,', 'tenho rima na mão,', 'e quando a viola chora', 'responde o meu coração!'],
        },
        {
          sound: 'IA', bpm: 92, density: 0.6, correct: 0.5,
          opp: ['Muito bem, minha menina,', 'tu tem jeito pra poesia!', 'Mas peleja de verdade', 'é mais que só cantoria:', 'é rimar na hora certa,', 'sem perder a valentia!'],
          resp: ['Seu Sabiá, pode apertar,', 'que o meu verso não esfria:', 'eu rimo de madrugada,', 'rimo em pleno meio-dia,', 'e se o sol um dia sumir', 'eu acendo a cantoria!'],
        },
      ],
    },
    mandacaru: {
      opp: 'manC', title: 'A Peleja do Espinho', stage: 'serra',
      rounds: [
        {
          sound: 'EIRA', bpm: 96, density: 0.7, correct: 0.5,
          opp: ['Eu sou Capitão Mandacaru,', 'o terror desta ribeira!', 'Tenho espinho pra vender,', 'sou mais quente que fogueira,', 'e menina que me enfrenta', 'volta pra casa na poeira!'],
          resp: ['Capitão, com todo respeito,', 'isso é pura brincadeira:', 'cacto que fala grosso', 'murcha na primeira feira!', 'Eu não volto pra poeira:', 'vim de longe, da porteira!'],
        },
        {
          sound: 'ÃO', bpm: 104, density: 0.8, correct: 0.5,
          opp: ['A Traça me deu tinta nova,', 'tinta preta, de carvão!', 'Me disse que o tal poeta', 'me largou no sol, no chão,', 'e agora eu sou raiva pura', 'da raiz até o gibão!'],
          resp: ['Essa tinta não é sua,', 'é tinta de confusão!', 'Quem te escreveu com espinho', 'te deu flor de montão:', 'mandacaru quando flora', 'é chuva no meu sertão!'],
        },
        {
          sound: 'OR', bpm: 112, density: 0.85, correct: 0.45,
          opp: ['Flor? Em mim? Tu tá variando!', 'Eu só conheço é a dor!', 'Nunca vi chuva cair,', 'só conheci o calor...', 'me diz, menina, é verdade', 'que eu também sei dar flor?'],
          resp: ['É verdade, Capitão,', 'eu lhe juro, por favor:', 'debaixo de todo espinho', 'dorme um botão de flor,', 'e a tinta que te amarra', 'se desfaz com um pouco de amor!'],
        },
      ],
    },
    renda: {
      opp: 'renC', title: 'A Peleja da Linha', stage: 'acude',
      rounds: [
        {
          sound: 'INHO', bpm: 100, density: 0.75, correct: 0.5,
          opp: ['Senta aqui, minha netinha,', 'vem pra perto, bem pertinho...', 'Eu teço renda desde nova,', 'ponto a ponto, devagarinho,', 'e quem cai na minha teia', 'nunca mais acha o caminho!'],
          resp: ['Dona Renda, a senhora tece', 'com agulha e com carinho,', 'mas quem tece pra prender', 'tá tecendo o próprio ninho:', 'eu desato esse seu nó', 'e sigo no meu caminho!'],
        },
        {
          sound: 'ELA', bpm: 110, density: 0.85, correct: 0.5,
          opp: ['Eu tecia o céu de renda', 'pra enfeitar cada janela,', 'mas a Traça veio à noite,', 'furou tudo, feito vela...', 'então eu teci mais forte:', 'prendi o céu numa cela!'],
          resp: ['Céu não é pra ficar preso,', 'nem a lua, nem estrela;', 'renda boa deixa a luz', 'passar por dentro dela:', 'solta o céu, Dona Renda,', 'que a noite fica mais bela!'],
        },
        {
          sound: 'ADA', bpm: 120, density: 0.9, correct: 0.45,
          opp: ['Ai, menina, que vergonha,', 'eu fiquei tão enredada...', 'espetei o povo todo,', 'fui ficando amargurada...', 'me diz: ainda tem jeito', 'pra uma velha atrapalhada?'],
          resp: ['Tem jeito, sim, minha avó,', 'toda linha é consertada:', 'desfaz o ponto errado,', 'começa outra laçada,', 'que a renda mais bonita', 'é a renda recomeçada!'],
        },
      ],
    },
    coronel: {
      opp: 'cor', title: 'A Peleja da Escritura', stage: 'cidade',
      rounds: [
        {
          sound: 'ENTE', bpm: 104, density: 0.85, correct: 0.5,
          opp: ['Eu sou Coronel Papelão,', 'dono de tudo e de gente!', 'Tenho escritura do vento,', 'do rio e da semente,', 'e quem discorda de mim', 'eu carimbo, imediatamente!'],
          resp: ['Coronel, o senhor é feito', 'de caixa velha e corrente:', 'quem compra o vento, Coronel,', 'só leva ar pela frente...', 'e papelão, quando chove,', 'amolece de repente!'],
        },
        {
          sound: 'URA', bpm: 114, density: 0.9, correct: 0.45,
          opp: ['Insolente! Petulante!', 'Isso é uma ditadura!', 'Digo... ultraje! Tenho firma,', 'tenho carimbo e assinatura,', 'e o final da história é meu:', 'tá lavrado em escritura!'],
          resp: ['Final não se compra na feira', 'como quem compra rapadura;', 'final se escreve com gente,', 'com coragem e com ternura...', 'e o seu, Coronel, tá torto:', 'não tem rima nem costura!'],
        },
        {
          sound: 'AR', bpm: 124, density: 0.95, correct: 0.45,
          opp: ['Tá bem, tá bem, eu confesso:', 'nunca soube versejar!', 'Comprei o poeta inteiro', 'só pra ele me rimar...', 'é que ninguém nunca quis', 'escrever sobre o meu lugar.'],
          resp: ['Pois então, meu Coronel,', 'é só pedir, sem mandar:', 'toda gente tem história,', 'basta alguém querer contar...', 'solta o Mestre Firmino', 'e vem pra feira cantar!'],
        },
      ],
    },
    traca: {
      opp: 'tra', title: 'A Última Peleja', stage: 'margem', final: true,
      rounds: [
        {
          sound: 'AR', bpm: 108, density: 0.9, correct: 0.45,
          opp: ['Eu s_u fo_e de p_pel,', 'sou o que ning_ém quis gu_rdar;', 'nasci de cem f_lhas tortas', 'que o p_eta não soube acabar...', 'e agora eu como t_do', 'pra ver se aprendo a brilhar.'],
          resp: ['Traça, eu sei que tu tem fome,', 'mas comer não vai curar:', 'quem come o sol por saudade', 'fica escuro no lugar...', 'tu não precisa do sol:', 'precisa de alguém pra te olhar.'],
        },
        {
          sound: 'IA', bpm: 118, density: 0.95, correct: 0.45,
          opp: ['Ol_ar? Ning_ém me olha...', 'sou trist_za, sou agonia;', 'fui o verso q_e faltou', 'no fim de uma poesia...', 'o p_eta me esq_eceu', 'no fundo da gaveta fria.'],
          resp: ['Ele não te esqueceu, não,', 'te guardou por covardia:', 'tinha medo de acabar', 'o que tanto lhe doía...', 'mas quem guarda dor na gaveta', 'um dia vira ventania!'],
        },
        {
          sound: 'ÃO', bpm: 128, density: 1, correct: 0.45,
          opp: ['Então o q_e eu faço agora,', 'se não sou l_z nem canção?', 'S_u só asa de pap_l,', 'fome, bur_co, escuridão...', 'e o que eu mais q_eria', 'era a L_Z do coração.'],
          resp: ['Tu é saudade, Traça,', 'e saudade é um clarão:', 'é o amor que continua', 'depois da separação...', 'não precisa comer o sol:', 'deixa ele morar na mão.'],
        },
        {
          sound: 'ELA', bpm: 138, density: 1.05, correct: 0.45,
          opp: ['E se eu solt_r o que comi,', 'se eu abrir essa janela,', 'o m_ndo vai me querer?', 'Vai ter lugar pra ela,', 'a traça feia, rasgada,', 'que só q_eria ser vela?'],
          resp: ['Vai ter lugar, sim, senhora,', 'na mais alta passarela:', 'quem aprende a ser saudade', 'brilha mais que qualquer vela...', 'abre as asas, minha Traça:', 'vem ser sol, vem ser estrela!'],
        },
      ],
    },
  };

  // ==================================================================
  // LOJA DA DONA FILÓ
  // ==================================================================
  const shop = [
    { id: 'coracao', name: 'Remendo de Coração', desc: 'Mais um coração de fôlego. Costurado à mão, com linha dobrada.', price: [60, 100], max: 2, count: (s) => s.up.heart, apply: (s) => { s.maxHp += 2; s.hp = s.maxHp; s.up.heart++; } },
    { id: 'tinteiro', name: 'Tinteiro Maior', desc: 'O Seu Nanquim ganha um gargalo novo: tinta para cinco Carimbos seguidos.', price: [50], max: 1, need: (s) => s.abil.stamp, count: (s) => s.up.ink, apply: (s) => { s.maxInk = 150; s.ink = 150; s.up.ink = 1; } },
    { id: 'cordao', name: 'Cordão Trançado', desc: 'Couro trançado na ponta do cordão: o chicote bate mais forte.', price: [80, 130], max: 2, count: (s) => s.up.dmg, apply: (s) => { s.up.dmg++; } },
    { id: 'alpargata', name: 'Alpargata Ligeira', desc: 'Esquiva mais longa e que recarrega mais rápido. "Pé de vento, pé de gente."', price: [40, 70], max: 2, count: (s) => s.up.dodge, apply: (s) => { s.up.dodge++; } },
    { id: 'garrafada', name: 'Garrafada da Filó', desc: 'Enche o fôlego todinho. "Cura dor, quebranto e até saudade — um pouquinho."', price: [15], max: 999, count: () => 0, apply: (s) => { s.hp = s.maxHp; } },
  ];

  // ==================================================================
  // CONVERSAS (NPCs)
  // ==================================================================
  function nCordoes() {
    return ['oeste', 'igreja', 'leste'].filter((k) => F()['cordao_' + k]).length;
  }
  function nLamps() {
    return ['oeste', 'leste', 'norte'].filter((k) => F()['lamp_' + k]).length;
  }
  function nBells() {
    return ['A', 'B', 'C'].filter((k) => F()['sino_' + k]).length;
  }
  function nPrensas() {
    return ['oeste', 'leste', 'sul'].filter((k) => F()['prensa_' + k]).length;
  }
  function nEcos() {
    return [1, 2, 3, 4].filter((k) => F()['eco_' + k]).length;
  }

  const shopTalk = (hello) => [
    hello,
    {
      choice: [
        { text: 'Ver as mercadorias', steps: [{ run: (W, done) => G.Game.shop(done) }] },
        { text: 'Conversar', steps: [{ do: (W) => W.runScript(filoConversa()) }] },
        { text: 'Até mais, Dona Filó', steps: ['filo.feliz|Vai com Deus e volta com rima, meu fi!'] },
      ],
      who: 'zab', expr: 'feliz',
    },
  ];
  function filoConversa() {
    const c = S().chapter;
    if (c === 'cap1') return ['filo|Eu e a Lorota viemos pelo atalho da fogueira, fugindo daquela boca branca. A barraca é a mesma, só mudou o endereço!', 'filo.pensativo|Tu viu o Cego Sabiá? Ele ficou lá atrás, levando o povo pela igreja... Aquele homem enxerga mais que nós dois juntos.'];
    if (c === 'cap2') return ['filo|No Açude o povo paga em linha e botão. Eu aceito, que botão também é dinheiro redondo!', 'filo.triste|A Dona Renda era minha freguesa. Comprava folheto de romance. Ela lia chorando, com os óculos na ponta do nariz...'];
    if (c === 'cap3') return ['filo.bravo|Aqui na cidade o Coronel quer cobrar imposto de rapadura! Imposto de RAPADURA, Zabelê!', 'filo.determinado|Quebra essas prensas, minha fia. Que feira sem liberdade é só mercado.'];
    return ['filo|Tu tá cada dia mais parecida com heroína de folheto, sabia?'];
  }

  function talk(id, W, npc) {
    const f = F();
    const c = S().chapter;
    switch (id) {
      // --------------------------------------------------------------
      case 'filo':
        if (c === 'prologo') {
          if (!f.tarefaCordao) return ['filo.feliz|Bom dia, minha fia! Dia de feira, dia de sorte!'];
          if (nCordoes() < 3)
            return ['filo|Os três cordões, minha fia: um perto das casas do oeste, um na frente da igreja e outro do lado do palanque. Vai, vai, que freguês não espera!'];
          if (!f.solComido) return ['filo.feliz|Tá tudo lindo! Agora vai lá no palanque que o Cego Sabiá tá te chamando. Diz que tu tá muito metida a poeta!'];
          return ['filo.assustado|Valei-me! Corre, Zabelê! Espanta esses bichos de tinta!'];
        }
        if (!f['filoOla_' + c]) {
          f['filoOla_' + c] = true;
          const hello = {
            cap1: 'filo.feliz|Minha fia! Tu escapou! Eu e a Lorota viemos pelo atalho da fogueira. A barraca tá aberta: tem remendo pra tudo nesta vida!',
            cap2: 'filo.feliz|Olha quem chegou! Montei a barraca aqui na margem. Rimas na mão, mercadoria na sacola!',
            cap3: 'filo.sarcastico|Psiu! Barraca clandestina, minha fia. O Coronel não sabe que eu tô aqui. Compra rápido!',
            final: 'filo|Até aqui eu vim!',
          }[c];
          return shopTalk(hello || 'filo|Olá!');
        }
        return shopTalk('filo.feliz|Diga, meu fi! O que vai ser hoje?');
      // --------------------------------------------------------------
      case 'lor':
        return ['lor|Inhóóóóó!', { sfx: 'donkey' }, 'narr|Lorota, a burrinha da Dona Filó, parece concordar com tudo que você não disse.'];
      // --------------------------------------------------------------
      case 'sab':
        if (!f.tarefaCordao || nCordoes() < 3)
          return ['sab.feliz|Primeiro, o teu serviço,\ndepois, a cantoria:\npendura os teus folhetos,', 'sab.feliz|que eu te espero, menina,\naqui de noite e de dia —\nou até acabar o dia.'];
        if (!f.pelejaSabia) return G.Story.scripts.pelejaSabia();
        return ['sab.pensativo|Tem coisa vindo no céu, menina. O meu sabiá não mente.'];
      // --------------------------------------------------------------
      case 'can':
        if (c === 'prologo' && !f.solComido)
          return [
            'can|Tu sabia que Vila Rima tem autor, menina? É o que diz a lenda.',
            'can|Um poeta de terno branco escreveu a vila inteirinha num caderno. Escreveu a feira, a igreja, o sol... e tu também.',
            'zab.sarcastico|Eu? Vixe, Vovó. A senhora e suas histórias.',
            'can.pensativo|Hum. Mas repara: faz tempo que nada novo acontece por aqui. Nenhum menino nasce, nenhuma casa sobe...',
            'can.triste|Parece que a história... parou.',
          ];
        return ['can.assustado|Eu avisei! Eu avisei que a história tinha parado!'];
      // --------------------------------------------------------------
      case 'vir': {
        const lines = {
          prologo: ['vir|Bom dia, menina. Hoje, o dia, tá, bonito.', 'vir.pensativo|Tão, bonito, que dá, até, medo.'],
          cap1: ['vir|Os, versos, perdidos, menina. São, nove.', 'vir.pensativo|Quem, junta, os, nove, pode, escrever, um, final, diferente.', 'vir.sarcastico|Não, conte, pra, ninguém, que, eu, disse.'],
          cap2: ['vir|Toda, história, precisa, de, uma, pausa. Senão, o, fôlego, acaba.', 'vir.pensativo|O, ponto, termina. As, reticências, esperam. A, vírgula...', 'vir.feliz|...a, vírgula, continua.'],
          cap3: ['vir|Você, já, achou, ' + G.Save.meta.verses.length + ', dos, nove, versos.', 'vir.pensativo|O, Poeta, perdeu, um, poema, inteiro. Ele, acha, que, a, Traça, comeu.', 'vir|Mas, traça, só, come, o, que, ninguém, lê.'],
          final: ['vir|...'],
        };
        return lines[c] || lines.prologo;
      }
      // --------------------------------------------------------------
      case 'ze':
        if (c === 'prologo') {
          if (!f.solComido) return ['ze.feliz|Zabelê! Olha meus rojões! Hoje à noite vai ter fogueira e eu vou soltar tudo de uma vez!', 'ze.rindo|BUM! Hehehe!'];
          return ['ze.assustado|Eu não fui! Juro que não foi meu rojão que apagou o sol!'];
        }
        if (c === 'cap1') {
          if (f.bodinhaEntregue) return ['ze.feliz|A Bodinha tá comendo meu chapéu de novo. Tá tudo normal! Obrigado, Zabelê!'];
          if (f.bodinhaSegue) return ['ze.surpreso|É ela? É a Bodinha? Traz ela aqui pertinho!'];
          f.bodinhaQuest = true;
          return [
            'ze.chorando|Zabelê! A Bodinha fugiu quando o céu escureceu!',
            'ze.triste|Ela foi pro lado do *Vale dos Ossos*, a leste. Eu ouvi o sininho dela, blém, blém...',
            'zab.determinado|Não chora, Zé. Eu trago tua cabrita de volta.',
            'ze.feliz|Promete? Jura de dedinho?',
            'zab.feliz|Juro de chapéu, que vale mais.',
          ];
        }
        return ['ze|...'];
      case 'bod':
        if (f.bodinhaEntregue) return ['narr|Bodinha mastiga, muito satisfeita, a ponta de um folheto.'];
        if (f.bodinhaSegue) return ['narr|Bodinha te segue, balançando o sininho. Blém, blém.'];
        return [
          { sfx: 'goat' },
          'narr|Uma cabritinha de sininho no pescoço, encurralada entre os xique-xiques. Ela te olha como quem pede colo.',
          'zab.feliz|Tu é a Bodinha, né? Vem, bichinha. O Zé tá te procurando.',
          { sfx: 'goat' },
          { do: (W2) => { F().bodinhaSegue = true; const b = W2.find('bod'); if (b) b.followPlayer = true; } },
          { toast: 'A Bodinha está te seguindo. Leve-a ao Zé, no Pouso.' },
        ];
      // --------------------------------------------------------------
      case 'tiao':
        if (f.serraAberta) return ['tiao|...A serra abriu. Boa, moça.', 'tiao.pensativo|O Capitão não era ruim, sabe. Só era sozinho.'];
        return ['tiao|Três candeeiros. Oeste, leste, norte. Acende, e a serra abre.', 'tiao|Descansar num candeeiro aceso restaura o fôlego e guarda o caminho.', 'tiao.bravo|E cuidado com o calango de chumbo. Só anda em linha reta. Sai da frente dele.'];
      // --------------------------------------------------------------
      case 'moca1':
        return ['moca|Dizem que o Cego Sabiá nunca perdeu uma peleja. Nem pro próprio Cão, quando ele apareceu de chapéu vermelho!'];
      case 'moca2':
        return f.solComido ? ['moca.assustado|A igreja! Vamos todos pra igreja!'] : ['moca|A igreja tá fechada hoje. O padre foi pra cidade e ainda não voltou.', 'moca.pensativo|Dizem que ele foi atrás do Poeta. Que o Poeta sumiu.'];
      case 'vend1':
        return ['vend|Rapadura! Rapadura de papel crepom, a mais doce do sertão!', 'vend.sarcastico|Não pode morder a embalagem. A embalagem É a rapadura.'];
      case 'vend2':
        return ['vend|Pote de barro! Cabe água, feijão e segredo!'];
      case 'meni1':
        return ['meni|Tia Zabelê, me conta um folheto?', 'zab.feliz|Depois da feira, menino. Prometo.', 'meni.feliz|Oba!'];
      // --------------------------------------------------------------
      case 'tete':
      case 'lala':
        if (f.bilroEntregue) return ['tete.feliz|Obrigada, Zabelê! Com o Bilro de Ouro a gente...', 'lala.feliz|...tece até o arco-íris.'];
        if (f.item_bilroOuro) return G.Story.scripts.bilroEntrega();
        if (!f.bilroQuest) {
          f.bilroQuest = true;
          return [
            'tete.triste|Zabelê, tu que é ligeira... A gente perdeu o...',
            'lala.triste|...Bilro de Ouro. O bilro que a nossa mãe...',
            'tete|...deixou pra gente. Caiu do barco quando os peixes-tinta...',
            'lala.assustado|...atacaram! Ficou na *Ilha do Barco Afundado*, a leste. Dá pra ir pelo *píer de madeira*.',
            'zab.determinado|Pode deixar. Eu trago.',
            'tete.feliz|A gente te dá um...',
            'lala.feliz|...presente bonito em troca!',
          ];
        }
        return ['lala|O Bilro de Ouro tá na ilha do leste. Pelo píer...', 'tete|...de madeira. Cuidado com os peixes!'];
      case 'anz':
        if (nBells() >= 3) return ['anz.feliz|Três sinos, três pontes! Tu pesca melhor que eu, moça. E olhe que eu já peguei um peixe DESTE tamanho!'];
        return [
          'anz|Os sinos de bilro, moça, são que nem isca: tu acerta de longe e a ponte morde.',
          'anz|Joga um *pregador* neles! Um sino fica numa ilhota aqui perto da margem — mira de cima da areia.',
          'anz.bravo|E cuidado com os *peixes-tinta*. Cospem que nem sogra. Só dá pra acertar quando eles sobem.',
        ];
      // --------------------------------------------------------------
      case 'biu':
        if (f.biuLivre) return ['biu.feliz|Figurante número três: "homem assustado na feira". Tô ensaiando! AAAH! ...Ficou bom?'];
        if (f.item_contrato) return G.Story.scripts.biuLivre();
        if (!f.biuQuest) {
          f.biuQuest = true;
          return [
            'biu.triste|Moça... eu não aguento mais ser jagunço. Eu nem sei segurar esse fuzil de papel direito.',
            'biu.pensativo|Eu queria era ser figurante de novela. Mas assinei um *contrato* com o Coronel.',
            'biu|O contrato tá guardado no *pátio da prensa leste*. Se tu achar, eu rasgo e fico livre!',
            'zab.feliz|Figurante de novela, é? Pode deixar, Biu.',
          ];
        }
        return ['biu|O contrato tá no pátio leste, moça. Cuidado com os soldados-carimbo.'];
      case 'juca':
        if (nPrensas() >= 3) return ['juca.feliz|EXTRA! EXTRA! TRÊS PRENSAS QUEBRADAS! PORTÃO DA TIPOGRAFIA ABERTO! CORONEL ESCONDIDO DEBAIXO DA MESA!', 'juca.sarcastico|Essa última eu inventei. Mas vai acontecer.'];
        if (nPrensas() >= 1) return ['juca.feliz|EXTRA! EXTRA! MENINA DE CHAPÉU DE COURO QUEBRA PRENSA DO CORONEL!', 'juca.rindo|Tô vendendo que nem água!'];
        return ['juca|EXTRA! EXTRA! CORONEL COMPRA O HORIZONTE!', 'juca.sarcastico|...ainda tá no parcelamento.', 'juca|As três prensas ficam nos pátios: oeste, leste e sul. Quebrar é crime! ...Mas eu não vi nada.'];
      case 'zef':
        return ['zef|Pão de papel, fresquinho! Ninguém compra...', 'zef.bravo|O Coronel tabelou o preço em "um elogio a ele". Aí o povo prefere passar fome.', 'zef.feliz|Toma um de graça, minha filha. Pão não se nega a quem luta.', { do: () => { S().hp = S().maxHp; Au.sfx('heal'); } }, { toast: 'Fôlego recuperado!' }];
      default:
        return ['narr|...'];
    }
  }

  // ==================================================================
  // ROTEIROS
  // ==================================================================
  const scripts = {
    pelejaSabia: () => [
      { bars: true },
      'sab.feliz|Ô Zabelê, vem cá, vem,\nque eu escutei o teu passo:\ntu diz que rima melhor',
      'sab.feliz|que o cantador que eu faço?\nEntão sobe no palanque\ne me mostra o teu compasso!',
      'zab.sarcastico|Oxe! E eu lá tenho medo de verso, Seu Sabiá? Bora!',
      { peleja: 'sabia' },
      { flag: 'pelejaSabia' },
      { bars: true },
      'sab.rindo|Mas olha que a menina\ntem a língua afiada!\nGuarda essa rima, criança,',
      'sab.pensativo|que vai ser muito usada:\ntem coisa vindo no céu\nque não é coisa falada...',
      { emote: 'zab', e: '?' },
      'zab.pensativo|Coisa no céu? Que coisa, Seu Sabiá?',
      { sfx: 'bird' },
      { emote: 'sab', e: '!' },
      'sab.assustado|Meu sabiá tá agitado... O vento parou. Escuta, menina: o *silêncio* chegou antes do barulho.',
      { do: (W) => W.runScript(scripts.solComido()) },
    ],
    solComido: () => [
      { bars: true },
      { music: null, fadeT: 1.5 },
      { amb: 'wind' },
      { sfx: 'rumble', opt: { dur: 2 } },
      { shake: 3, t: 1.6 },
      { sfx: 'wings', opt: { dur: 2 } },
      { wait: 1.2 },
      { panel: 'solComido', dur: 9.5, skip: true },
      { flag: 'solComido' },
      { sfx: 'chomp' },
      { shake: 10, t: 0.8 },
      { music: 'tension' },
      'filo.assustado|Valei-me, minha Nossa Senhora do Carimbo! COMERAM O SOL!',
      'can.assustado|Eu avisei! Eu avisei que a história tinha parado!',
      { sfx: 'drip' },
      { do: (W) => G.Story.chapters.prologo.spawnBorroes(W) },
      { wait: 1.2 },
      'sab.bravo|Menina, pega o teu cordão:\nesses borrões não são festa!\nQuem canta bem, também bate,',
      'sab.determinado|e o que não rima não presta!',
      'zab.determinado|Pois venham! Cordão de folheto também estala!',
      { bars: false },
      { music: 'boss' },
      { hint: 'Chicote de Cordel (aperte de novo para o combo)', keys: ['attack'], t: 6 },
      { do: (W) => { W.later = 6; } },
    ],
    feiraComida: () => [
      { wait: 0.8 },
      { bars: true },
      { music: null },
      { sfx: 'rumble', opt: { dur: 2.5 } },
      { shake: 5, t: 2.5 },
      'zab.surpreso|Tá tremendo... o chão tá tremendo!',
      { cam: { pt: 'sul', dy: -40 }, t: 1.5 },
      { do: (W) => { W.voidY = W.map.h * T + 60; W.voidTarget = 25.5 * T; } },
      { sfx: 'chomp' },
      { wait: 1.4 },
      { sfx: 'chomp' },
      { wait: 1.4 },
      'can.assustado|A página! Tão comendo a *página* da feira!',
      { cam: 'sab', t: 1 },
      'sab.bravo|Corre pro norte, Zabelê,\npela Porteira, ligeiro!\nQue a Traça come o que acaba',
      'sab.determinado|e esta feira é o primeiro!\nEu levo o povo pela igreja:\ncego conhece o atalho inteiro.',
      'zab.assustado|E o senhor?!',
      'sab.feliz|Cego não precisa de caminho, menina. Precisa de coragem. VAI!',
      { flag: 'fugaComecou' },
      { fade: 'out', t: 0.9 },
      { do: () => G.Game.goMap('fuga', null, null, { transition: 'none' }) },
    ],
    porteira: () => [
      { do: (W) => { W.chase.stopped = true; } },
      { bars: true },
      { music: null, fadeT: 0.5 },
      { pose: 'zab', p: 'lie' },
      { sfx: 'thud' },
      { shake: 4, t: 0.3 },
      'zab.assustado|Ai! Minha canela!',
      { do: (W) => { const z = W.player; W.spawn({ kind: 'nanquim', id: 'nan', x: z.x + 170, y: z.y + 20, follow: false }); } },
      { sfx: 'clank' },
      { move: 'nan', to: { rel: 'zab', dx: 36, dy: 4 }, speed: 220 },
      { face: 'nan', dir: 'left' },
      { emote: 'nan', e: 'raiva' },
      'nan.bravo|Ai! Olhe por onde pisa, senhorita! Isto aqui é *cristal da Boêmia*!',
      { pose: 'zab', p: null },
      'zab.surpreso|Um... tinteiro? FALANDO?!',
      'nan.sarcastico|Tinteiro, não. *Seu Nanquim*, tinteiro oficial do Mestre Firmino, com muita honra e pouca tinta.',
      'nan|Agora, se a senhorita não se importa... AQUILO está vindo pra cá.',
      { sfx: 'chomp' },
      { shake: 6, t: 1 },
      { do: (W) => { W.chase.qteVoid = true; } },
      'nan.determinado|Mergulhe a mão na minha tinta e bata no chão! Com força! Como quem carimba um documento muito importante!',
      { do: (W) => { S().abil.stamp = true; S().ink = S().maxInk; W.qte = 'stamp'; W.qteDone = false; } },
      { hint: 'CARIMBE O CHÃO!', keys: ['stamp'], t: 60 },
      { until: (W) => W.qteDone },
      { do: (W) => { W.hint = null; W.qte = null; W.chase.qteVoid = false; W.voidY += 160; W.voidStop = true; W.fx.stampMark(W.player.x, W.player.y + 90, 'PARE!', { size: 60, life: 6 }); } },
      { flash: '#fff8e0', t: 0.6 },
      { shake: 12, t: 0.8 },
      { sfx: 'boom' },
      { wait: 1 },
      'nan.sarcastico|Hum. Nada mal... para uma amadora.',
      { give: 'stamp' },
      'zab.surpreso|O que... o que foi *aquilo*? O que tá acontecendo com a feira?',
      { music: 'sad' },
      'nan|A senhorita nunca desconfiou? Este mundo é um *folheto*. Um livro de cordel escrito pelo Mestre Firmino, verso por verso.',
      'nan|Tudo aqui — a serra, o açude, a feira, a senhorita — é tinta sobre papel.',
      'zab.pensativo|...Eu sempre achei que o céu tinha cheiro de papel novo.',
      'nan.triste|Acontece que o Mestre parou de escrever. Faz tempo. E história sem final é banquete de *traça*.',
      'nan|Ela come o que não termina. Hoje comeu o sol. Amanhã... come o resto.',
      'zab.determinado|Então a gente acha esse tal Mestre e manda ele terminar a história!',
      'nan.sarcastico|"A gente"? Eu sou um tinteiro, senhorita, não um jumento de carga.',
      { wait: 0.5 },
      { emote: 'nan', e: '...' },
      'nan.bravo|...Hunf. Está bem. Mas eu vou do seu lado. E sem sacolejar.',
      'nan|Pelo que o vento contou, a Traça passou pelo *Sertão das Letras Soltas*. Sem sol, os candeeiros de lá apagaram.',
      'zab.feliz|Então é pra lá que a gente vai. Bora, Seu Nanquim!',
      { do: (W) => { F().nanquim = true; if (W.nan) W.nan.follow = true; } },
      { fade: 'out', t: 1.2 },
      { do: () => G.Game.chapterComplete('prologo') },
    ],
    cap1Intro: () => [
      { title: 'CAPÍTULO I', sub: 'O Sertão das Letras Soltas', dur: 4 },
      { bars: true },
      { cam: { pt: 'pouso', dy: -40 }, t: 0 },
      { move: 'zab', to: { tile: [32, 53] }, speed: 90, wait: false },
      { move: 'nan', to: { tile: [33, 54] }, speed: 90 },
      'zab.pensativo|Que escuridão... Nunca vi o sertão assim, sem sol. Parece que alguém apagou o dia com o dedo.',
      'nan|O Pouso do Vaqueiro. Pelo menos aquele candeeiro ainda está aceso.',
      'nan|Anote nos autos, senhorita: *descansar num candeeiro aceso* restaura o fôlego e guarda o nosso progresso.',
      { cam: 'tiao', t: 1 },
      'tiao|...Moça. Tinteiro.',
      'nan.sarcastico|*Seu Nanquim*, cavalheiro. Com todo o respeito.',
      'tiao|Os três candeeiros da serra apagaram quando o sol sumiu. Oeste, leste, norte. Sem eles, a *Serra do Chapéu* não abre.',
      'tiao.bravo|E lá em cima tá o Capitão Mandacaru. Mais bravo que boi em cerca.',
      'zab.determinado|Três candeeiros. Deixa comigo.',
      { flag: 'cap1Intro' },
      { camFollow: true },
      { bars: false },
      { checkpoint: true },
      { hint: 'Abra o Caderno para ver o mapa e a missão', keys: ['journal'], t: 6 },
    ],
    serraAbre: () => [
      { bars: true },
      'nan.feliz|O terceiro! Olhe lá, senhorita: a luz está correndo pela serra!',
      { cam: { pt: 'serraCam' }, t: 2.6 },
      { sfx: 'rumble', opt: { dur: 2.2 } },
      { shake: 6, t: 2 },
      { flag: 'serraAberta' },
      { wait: 2.2 },
      { cam: 'zab', t: 1.6 },
      'zab.feliz|A pedra rolou! O caminho da Serra do Chapéu tá aberto!',
      'nan|Prepare-se. Cacto que fala grosso costuma ter espinho sobrando.',
      { camFollow: true },
      { bars: false },
    ],
    bossMandacaru: () => [
      { bars: true },
      { music: null },
      { cam: { pt: 'boss', dy: 20 }, t: 0 },
      { move: 'zab', to: { pt: 'centro', dy: 100 }, speed: 90, wait: false },
      { move: 'nan', to: { pt: 'centro', dx: 40, dy: 120 }, speed: 90, wait: false },
      { wait: 1.2 },
      'manC.bravo|Quem vem lá? Quem tem a coragem de subir na MINHA serra sem pedir licença ao Capitão Mandacaru?',
      { cam: 'zab', t: 1 },
      'zab.determinado|Zabelê, da Vila Rima. Vim só passar, Capitão. Tô atrás do Mestre Firmino.',
      { cam: 'man', t: 0.8 },
      { shake: 4, t: 0.5 },
      'manC.bravo|Firmino... O POETA! O cabra que me escreveu cheio de espinho e me largou no sol pra secar!',
      'manC.bravo|Pois a Traça me contou tudinho. Ela me deu tinta nova, menina. *Tinta de raiva.*',
      'nan.pensativo|Senhorita... repare nas gotas pretas escorrendo. É tinta da Traça. Ele está sendo *reescrito*.',
      'manC.bravo|Chega de prosa! Cabra macho resolve é no espinho!',
      { sfx: 'roar' },
      { shake: 8, t: 0.6 },
      { music: 'boss' },
      { camFollow: true },
      { bars: false },
      { do: (W) => { W.boss.active = true; if (W.nan) W.nan.follow = true; } },
      { hint: 'Faça ele bater na parede e castigue enquanto está tonto!', keys: ['dodge', 'attack'], t: 6 },
    ],
    mandacaruVence: () => [
      { bars: true },
      { music: null },
      { wait: 0.8 },
      { fade: 'out', t: 0.3 },
      { do: (W) => W.stageBoss(150) },
      { fade: 'in', t: 0.4 },
      { cam: 'man', t: 1, zoom: 1.15 },
      'manC.triste|Arre... tu bate bem, menina. Mas a tinta não sai... ela aperta... Só sai com... com *verso*...',
      'nan.surpreso|É isso! A tinta da Traça só se desfaz com *rima*! Desafie ele para uma peleja, senhorita!',
      'zab.determinado|Capitão Mandacaru! Eu lhe desafio pra uma PELEJA!',
      'manC.rindo|Peleja? Comigo? HA! Eu sou o maior repentista da caatinga! Aceito, menina. Aceito!',
      { peleja: 'mandacaru' },
      { bars: true },
      { do: (W) => G.Story.cleanse(W, W.find('man')) },
      { wait: 2 },
      { music: 'ending' },
      'man.feliz|Eita... tô leve que só flor de algodão.',
      'man.triste|Menina, desculpe o mau jeito. Aquela Traça... ela chegou aqui *chorando*. Chorando tinta. Disse que tava com fome de luz.',
      'man|E eu, besta que só, dei ouvido. Achei que se eu fosse mais bravo, o mundo ia me olhar mais.',
      'zab.feliz|O senhor floresceu, Capitão. Isso o mundo olha.',
      'man.rindo|HA! Flor de mandacaru! Faz tempo que eu não sentia isso.',
      'man|Toma aqui meus *pregadores de mira*. Espinho eu não te dou, que machuca. Mas pregador alcança tudo que é longe.',
      { give: 'throw' },
      'man.pensativo|A Traça voou pro *Açude das Rendas*, onde a Dona Renda tece o céu. E tem outra coisa...',
      'man|Ela tinha um olho diferente dos outros. Um olho de *gente*.',
      { emote: 'zab', e: '?' },
      'nan.pensativo|...Um olho de gente.',
      { fade: 'out', t: 1.2 },
      { do: () => G.Game.chapterComplete('cap1') },
    ],
    bodinhaVolta: () => [
      { bars: true },
      { sfx: 'goat' },
      'ze.surpreso|BODINHA!!!',
      { do: (W) => { const b = W.find('bod'); if (b) { b.followPlayer = false; b.goTo(W.find('ze').x + 30, W.find('ze').y + 6, 160); } } },
      { wait: 1 },
      { emote: 'ze', e: 'coração' },
      'ze.chorando|Tu voltou, bichinha! Tu voltou!',
      'ze.feliz|Obrigado, Zabelê! Toma: é um *remendo de coração* que minha vó costurou. Diz que aguenta até coice de jumento!',
      { do: () => { S().maxHp += 2; S().hp = S().maxHp; F().bodinhaEntregue = true; Au.jingle('verse'); } },
      'narr|Você ganhou um *Remendo de Coração*! Mais um coração de fôlego.',
      { bars: false },
    ],
    cap2Intro: () => [
      { title: 'CAPÍTULO II', sub: 'O Açude das Rendas', dur: 4 },
      { bars: true },
      { cam: { pt: 'ponteA', dy: -300 }, t: 0 },
      { cam: { pt: 'margem' }, t: 3.2 },
      'zab.surpreso|Olha o céu, Seu Nanquim! Tem uma *renda* enorme cobrindo tudo...',
      'nan|Obra da Dona Renda. Dizem que ela teceu o céu desta região inteirinho. Linha por linha.',
      { cam: 'tete', t: 1 },
      'tete.feliz|Zabelê! Que bom que tu...',
      'lala.feliz|...chegou! A gente estava...',
      'tete|...tecendo, tecendo, quando a Traça passou...',
      'lala.triste|...e a Dona Renda ficou esquisita. Espetando todo mundo.',
      'tete.triste|Ela recolheu as pontes de renda. Só tocando os três *sinos de bilro* pra elas subirem de novo.',
      'lala|Os sinos ficam nas ilhotas, longe da margem...',
      'zab.determinado|Longe? Isso é serviço pro pregador.',
      { flag: 'cap2Intro' },
      { camFollow: true },
      { bars: false },
      { checkpoint: true },
      { hint: 'Arremesse o pregador nos sinos distantes', keys: ['throw'], t: 6 },
    ],
    bilroEntrega: () => [
      'tete.surpreso|O Bilro de...',
      'lala.feliz|...OURO! Tu achou!',
      'tete.feliz|Toma, Zabelê. A gente achou isso enrolado numa linha velha, faz tempo...',
      'lala|...uma folha com um verso bonito. Parece letra de poeta.',
      { do: () => { F().bilroEntregue = true; S().flags.verso_5 = true; } },
      { run: (W, done) => { Au.jingle('verse'); G.Game.showVerse(5, G.Save.addVerse(5), done); } },
    ],
    bossRenda: () => [
      { bars: true },
      { music: null },
      { cam: { pt: 'boss', dy: 30 }, t: 0 },
      { move: 'zab', to: { pt: 'start', dy: -170 }, speed: 90, wait: false },
      { move: 'nan', to: { pt: 'start', dx: 40, dy: -150 }, speed: 90, wait: false },
      { wait: 1.2 },
      'renC.feliz|Ora, ora, uma visita! Senta, menina, senta. Quer um cafezinho? Uma bolachinha?',
      'renC.sarcastico|Ou um *ponto-cruz* nas costas?',
      'zab.surpreso|Dona Renda? A senhora tá... com seis braços?',
      'renC|Quanto mais braço, mais renda, minha filha. Eu fiz uma renda tão grande, tão linda, pra esconder o céu da Traça...',
      'renC.bravo|...e ela entrou foi pelo *buraquinho*. Todo ponto tem seu nó, menina. E o meu nó, agora, é você!',
      'nan.determinado|Senhorita! Os bilros girando em volta dela são um escudo. Derrube-os com o *pregador* e depois ataque!',
      { music: 'boss' },
      { camFollow: true },
      { bars: false },
      { do: (W) => { W.boss.active = true; if (W.nan) W.nan.follow = true; } },
      { hint: 'Derrube os bilros e ataque quando ela ficar tonta', keys: ['throw', 'attack'], t: 6 },
    ],
    rendaVence: () => [
      { bars: true },
      { music: null },
      { wait: 0.8 },
      { fade: 'out', t: 0.3 },
      { do: (W) => W.stageBoss(150) },
      { fade: 'in', t: 0.4 },
      { cam: 'ren', t: 1, zoom: 1.1 },
      'renC.triste|Ai... ai, meus bilros... a linha embolou toda...',
      'zab.determinado|Dona Renda, eu lhe desafio pra uma peleja! Pra desembolar essa linha de vez!',
      'renC.feliz|Peleja? Hi hi! Faz sessenta anos que ninguém me desafia. Vamos ver se tu tem ponto firme!',
      { peleja: 'renda' },
      { bars: true },
      { do: (W) => G.Story.cleanse(W, W.find('ren')) },
      { wait: 2 },
      { music: 'ending' },
      'ren.triste|Ai, que vergonha. Espetei tanta gente... Obrigada, menina.',
      'ren|Escuta bem: o Firmino *não morreu*. Tá vivo, mas com a alma desfiada.',
      'ren.pensativo|O *Coronel Papelão* mandou buscar ele na Cidade de Papelão. Quer que o poeta escreva o final da história. Um final onde o Coronel é dono de tudo.',
      'nan.bravo|Aquele pedaço de caixa de sapato!',
      'ren.triste|E tem mais. Quando *a Luz dele* se apagou, o Firmino parou de escrever. A Luz dele, entende?',
      'zab.pensativo|O sol?',
      'ren.triste|...Também.',
      'ren.feliz|Toma, menina: um remendo de coração, tecido com linha dobrada. E a minha melhor linha de renda. Teu cordão vai alcançar mais longe.',
      { do: () => { S().maxHp += 2; S().hp = S().maxHp; S().up.whip++; } },
      { give: 'renda' },
      'ren|Vou tecer uma ponte de renda daqui até a cidade. Vai com Deus e com linha boa.',
      { fade: 'out', t: 1.2 },
      { do: () => G.Game.chapterComplete('cap2') },
    ],
    cap3Intro: () => [
      { title: 'CAPÍTULO III', sub: 'A Cidade de Papelão', dur: 4 },
      { bars: true },
      { cam: { pt: 'beco' }, t: 0 },
      { cam: { pt: 'tipografia', dy: 60 }, t: 3.2 },
      'nan|A Cidade de Papelão. Tudo aqui é caixa, carimbo e propaganda. Lá no alto, a *Tipografia* do Coronel.',
      { cam: { pt: 'beco' }, t: 2 },
      'juca.feliz|EXTRA! EXTRA! CORONEL PAPELÃO ANUNCIA O FINAL DA HISTÓRIA: "E O CORONEL FOI DONO DE TUDO. FIM."',
      'zab.bravo|Final? Que final? Isso nem rima!',
      'biu.triste|Psiu, moça! Fala baixo... As *três prensas* do Coronel imprimem esse final dia e noite. Quanto mais cópia, mais verdade ele vira.',
      'biu|Se as prensas quebrarem, o portão da Tipografia abre. É lá que o Coronel guarda o poeta.',
      'zab.determinado|Então vamos quebrar umas prensas.',
      'nan.sarcastico|Finalmente um plano que eu aprovo sem ressalvas.',
      { flag: 'cap3Intro' },
      { camFollow: true },
      { bars: false },
      { checkpoint: true },
      { hint: 'Cuidado com os carimbos gigantes nas ruas!', keys: ['dodge'], t: 5 },
    ],
    biuLivre: () => [
      'biu.surpreso|Meu contrato! Tu achou!',
      { sfx: 'tear' },
      'narr|Biu rasga o contrato em mil pedacinhos, que saem voando feito borboleta de papel.',
      'biu.rindo|EU SOU LIVRE! Vou ser figurante! Figurante número três: "homem assustado na feira"!',
      'biu.feliz|Toma, moça: meu remendo de coração de reserva. Jagunço sempre carrega um.',
      { do: () => { S().maxHp += 2; S().hp = S().maxHp; F().biuLivre = true; Au.jingle('verse'); } },
      'narr|Você ganhou um *Remendo de Coração*! Mais um coração de fôlego.',
    ],
    tipografiaAbre: () => [
      { bars: true },
      'nan.feliz|A terceira prensa! Escute...',
      { cam: { pt: 'tipografia', dy: 140 }, t: 2.6 },
      { flag: 'tipografiaAberta' },
      { wait: 1.8 },
      'juca|(de longe) EXTRA! EXTRA! O PORTÃO DA TIPOGRAFIA SE ABRIU SOZINHO!',
      { cam: 'zab', t: 1.4 },
      'zab.determinado|Aguenta aí, Mestre Firmino. A gente tá chegando.',
      { camFollow: true },
      { bars: false },
    ],
    bossCoronel: () => [
      { bars: true },
      { music: null },
      { cam: { pt: 'boss', dy: -20 }, t: 0 },
      { move: 'zab', to: { pt: 'centro', dy: 110 }, speed: 90, wait: false },
      { move: 'nan', to: { pt: 'centro', dx: 40, dy: 130 }, speed: 90, wait: false },
      { wait: 1.2 },
      'cor.bravo|Alto lá! Propriedade privada! Tudo isso aqui tem escritura, carimbo e firma reconhecida em cartório!',
      'zab.determinado|Cadê o Mestre Firmino, Coronel?',
      'cor.sarcastico|O poeta está... a serviço. Escrevendo o final que *eu* encomendei:',
      'cor.feliz|"E o Coronel Papelão foi dono do sertão, do açude, da serra, do sol e da lua. FIM." Lindo, não é?',
      'nan.sarcastico|Isso não rima nem com reza brava.',
      'cor.bravo|Rima não é necessária quando se tem DINHEIRO! Prensa-Mor! *Confisque essa menina!*',
      { sfx: 'clank' },
      { shake: 6, t: 0.5 },
      { music: 'boss' },
      { camFollow: true },
      { bars: false },
      { do: (W) => { W.boss.active = true; if (W.nan) W.nan.follow = true; } },
      { hint: 'Depois do pisão, as válvulas ficam expostas: carimbe!', keys: ['dodge', 'stamp'], t: 6 },
    ],
    coronelVence: () => [
      { bars: true },
      { music: null },
      { wait: 0.8 },
      { fade: 'out', t: 0.3 },
      { do: (W) => W.stageBoss(150) },
      { fade: 'in', t: 0.4 },
      { cam: 'cor', t: 1 },
      'cor.assustado|Pare! Pare! Eu me rendo! Mas... mas eu exijo uma peleja! É meu direito constitucional!',
      'zab.sarcastico|Com todo prazer, Coronel.',
      { peleja: 'coronel' },
      { bars: true },
      'cor.chorando|Tá bom, tá bom! Eu devolvo o poeta! Mas não conta pra ninguém que eu perdi pra uma menina de chapéu de couro!',
      { music: 'sad' },
      { do: (W) => W.spawn({ kind: 'npc', char: 'firmino', id: 'fir', pt: 'mesa', dir: 'down', solid: false }) },
      { cam: 'fir', t: 1.6 },
      'narr|No fundo da Tipografia, preso à escrivaninha por correntes de papel, um velho de terno branco encara uma folha em branco.',
      { move: 'zab', to: { rel: 'fir', dy: 60 }, speed: 100 },
      { face: 'zab', dir: 'up' },
      'fir.triste|Quem... quem é você?',
      'zab.feliz|Zabelê, Mestre. Da Vila Rima. Página três.',
      'fir.surpreso|...Zabelê. Eu lembro de você. Eu te escrevi numa manhã de chuva... a menina que vendia os meus folhetos.',
      'fir.triste|Você não devia estar aqui. Nenhum personagem devia ter que vir buscar o autor.',
      'zab.determinado|É que o autor sumiu, Mestre. E a Traça tá comendo tudo.',
      { emote: 'fir', e: '...' },
      'fir.triste|A Traça... ela é minha.',
      'fir.triste|Quando Luzia morreu — minha mulher, minha luz — eu tentei escrever o sol pra ela. Tentei cem vezes. Amassei cem folhas.',
      'fir.chorando|E numa noite... ouvi as folhas se mexendo na gaveta.',
      'nan.triste|Mestre... o senhor nunca me contou.',
      'fir.surpreso|Nanquim? Meu velho tinteiro... você também veio.',
      { music: null },
      { sfx: 'chomp' },
      { shake: 10, t: 1.2 },
      { panel: 'tracaTeto', dur: 6, skip: true },
      { sfx: 'wings', opt: { dur: 1.5 } },
      'tra|...a úl_ima pá_ina... é m_nha...',
      { flash: '#fff8e0', t: 0.8 },
      'fir.assustado|A Última Página! Ela levou a Última Página pra *Margem*!',
      'zab.surpreso|Margem? Que margem?',
      'fir|A margem do livro. O branco onde vão as histórias que ninguém termina. Se ela comer aquela página, não sobra final nenhum. Pra ninguém.',
      { sfx: 'strum' },
      { do: (W) => { W.spawn({ kind: 'npc', char: 'sabia', id: 'sab', pt: 'start', dy: 40, dir: 'up', solid: false }); W.spawn({ kind: 'npc', char: 'candinha', id: 'can', pt: 'start', dx: 50, dy: 60, dir: 'up', solid: false }); } },
      { move: 'sab', to: { pt: 'centro' }, speed: 80, wait: false },
      { move: 'can', to: { pt: 'centro', dx: 70, dy: 100 }, speed: 70, wait: false },
      { cam: { pt: 'centro' }, t: 1.4 },
      { until: (W) => !W.find('sab').goal },
      'sab.determinado|Eu ouvi o bater das asas\nlá de longe, na estrada...\nA Margem só abre com canção,',
      'sab.determinado|com viola bem tocada:\nprotejam o velho cantor\nque eu abro essa passagem fechada!',
      'zab.determinado|Pode tocar, Seu Sabiá. Ninguém encosta no senhor.',
      { camFollow: true },
      { bars: false },
      { do: (W) => G.Story.chapters.cap3.startDefense(W) },
    ],
    defesaFalhou: () => [
      { bars: true },
      'sab.triste|Ai... a corda desafinou...',
      'nan.determinado|De novo, senhorita! Fique perto dele!',
      { bars: false },
      { do: (W) => G.Story.chapters.cap3.startDefense(W) },
    ],
    margemAbre: () => [
      { bars: true },
      { music: null },
      { sfx: 'breakStrings' },
      { shake: 5, t: 1 },
      'narr|No último acorde, as dez cordas da viola arrebentam de uma vez. E junto com elas, alguma coisa mais se parte.',
      { panel: 'margemAbre', dur: 6.5, skip: true },
      { music: 'sad' },
      'zab.assustado|Seu Sabiá? Seu Sabiá, fala comigo!',
      'narr|O cantador abre a boca, mas o verso não sai. Só um fio de voz, fino como linha de renda.',
      'sab.triste|...leva a minha rima, menina. Eu... te empresto.',
      { sfx: 'bird' },
      { emote: 'sab', e: 'nota' },
      'narr|O sabiá do chapéu canta no lugar dele. E a fenda branca no céu fica aberta.',
      'can.triste|Vai, minha filha. Eu cuido dele.',
      'fir.determinado|Espere. Eu vou junto.',
      'fir|Se tem alguém que precisa encarar aquele bicho... sou eu. Eu conheço o caminho das minhas próprias lembranças.',
      'nan.determinado|Então vamos, Mestre. Todos nós.',
      { fade: 'out', t: 1.4 },
      { do: () => G.Game.chapterComplete('cap3') },
    ],
    finalIntro: () => [
      { title: 'CAPÍTULO FINAL', sub: 'A Margem', dur: 4 },
      { bars: true },
      { do: (W) => W.spawn({ kind: 'npc', char: 'firmino', id: 'fir', x: W.player.x + 50, y: W.player.y - 20, dir: 'up', solid: false }) },
      { cam: 'zab', t: 0 },
      'zab.surpreso|Que lugar é esse? Tá tudo... em branco. E preto. Ao mesmo tempo.',
      'nan|A Margem, senhorita. Onde o autor não escreveu nada. Cuidado com o vazio: cair nele não mata, mas dói no orgulho.',
      'fir.triste|Estas páginas soltas... são lembranças minhas. De Luzia. Eu joguei tudo aqui quando parei de escrever.',
      'fir|Vou na frente. Me encontre na *Última Página*. E, se puder... leia as lembranças pelo caminho.',
      'fir.triste|Talvez você entenda melhor do que eu.',
      { move: 'fir', to: { rel: 'fir', dy: -140 }, speed: 70, wait: false },
      { alpha: 'fir', to: 0, t: 1.5 },
      { despawn: 'fir' },
      { flag: 'finalIntro' },
      { camFollow: true },
      { bars: false },
      { checkpoint: true },
    ],
    bossTraca: () => [
      { bars: true },
      { music: null },
      { amb: 'void' },
      { cam: { pt: 'boss', dy: 60 }, t: 0 },
      { do: (W) => W.spawn({ kind: 'npc', char: 'firmino', id: 'fir', x: 14 * T, y: 19.5 * T, dir: 'up', solid: false }) },
      { move: 'zab', to: { pt: 'centro', dy: 130 }, speed: 90, wait: false },
      { move: 'nan', to: { pt: 'centro', dx: 40, dy: 150 }, speed: 90, wait: false },
      { wait: 1.2 },
      'fir.triste|Luzia gostava de dizer que traça só come o que ninguém lê.',
      'fir|Olha ela. Enrolada na minha última página, como quem se agarra a um cobertor.',
      { sfx: 'wings', opt: { dur: 1.4 } },
      { shake: 4, t: 1 },
      'tra|...m_is... l_z... EU Q_ERO... A L_Z...',
      'zab.determinado|Seu Nanquim, Mestre... fiquem pra trás.',
      'nan.determinado|Ela vai comer o chão, senhorita! Não fique parada onde ela pousar, e bata quando ela descer pra mastigar!',
      { sfx: 'roar', opt: { p: 0.6 } },
      { music: 'traca' },
      { camFollow: true },
      { bars: false },
      { do: (W) => { W.boss.active = true; if (W.nan) W.nan.follow = true; } },
      { hint: 'Ela só pode ser atingida quando desce', keys: ['attack', 'throw'], t: 6 },
    ],
    tracaVence: () => [
      { bars: true },
      { music: null },
      { wait: 0.8 },
      { fade: 'out', t: 0.3 },
      { do: (W) => W.stageBoss(150) },
      { fade: 'in', t: 0.4 },
      { cam: 'tra', t: 1.2 },
      'tra|...n_o... ainda n_o...',
      'zab.determinado|Traça! Eu lhe desafio pra última peleja!',
      'nan.surpreso|Senhorita, ela não sabe rimar! Ela é feita de rascunho!',
      'zab.feliz|Então eu empresto a rima que o Seu Sabiá me deu.',
      { peleja: 'traca' },
      { bars: true },
      { music: 'sad' },
      'narr|A Traça se encolhe sobre a Última Página. As asas, antes enormes, agora parecem só um monte de papel molhado.',
      'tra|...eu s_ q_eria... a l_z...',
      { move: 'fir', to: { rel: 'tra', dx: -110, dy: 80 }, speed: 70 },
      { face: 'fir', dir: 'right' },
      'fir.triste|Eu sei. Eu também.',
      'fir|Nanquim... a pena. Eu preciso terminar.',
      { emote: 'fir', e: 'suor' },
      'fir.chorando|Não consigo. Toda vez que eu tento, a mão treme.',
      'nan.determinado|Então use a mão dela, Mestre.',
      'zab.surpreso|A minha?',
      'nan.feliz|A senhorita chegou até aqui escrevendo com os pés. Uma última linha não vai lhe custar nada.',
      {
        choice: [
          { text: 'Carimbar "FIM" na Traça', steps: ['zab.determinado|Chega de fome, chega de escuro. Esta história termina aqui.', { do: () => G.Game.ending('ponto') }] },
          { text: 'Deixar a Traça ir embora', steps: ['zab.triste|Ninguém devia ser carimbado por sentir falta de alguém.', { do: () => G.Game.ending('reticencias') }] },
          {
            text: 'Recitar os Versos Perdidos',
            if: () => G.Save.meta.verses.length >= 9,
            steps: ['zab.feliz|Mestre, espera. Eu achei uma coisa pelo caminho... nove coisas, pra ser exata.', { do: () => G.Game.ending('virgula') }],
          },
          { text: '??? (faltam Versos Perdidos)', locked: true, if: () => G.Save.meta.verses.length < 9 },
        ],
        prompt: 'Como termina esta história?',
        who: 'zab', expr: 'pensativo',
      },
    ],
  };

  // limpeza da tinta da Traça depois da peleja
  function cleanse(W, e) {
    if (!e) return;
    e.freed = true;
    e.corrupt = false;
    Au.sfx('verse');
    W.flash('#fff8e0', 1);
    W.shake(4, 0.6);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * U.TAU;
      W.fx.add({ type: 'ink', x: e.x + Math.cos(a) * 20, y: e.y - 60, vx: Math.cos(a) * 200, vy: Math.sin(a) * 120, z: 40, vz: 200, grav: 400, size: 4, life: 1, splat: true });
    }
    for (let i = 0; i < 16; i++) W.fx.add({ type: 'glow', x: e.x + (Math.random() - 0.5) * 80, y: e.y - 40 - Math.random() * 80, vy: -40, grav: 0, size: 10, life: 1.5, color: '#fff3c0' });
  }

  // ==================================================================
  // CAPÍTULOS
  // ==================================================================
  const chapters = {};

  // ------------------------------------------------------------------ PRÓLOGO
  chapters.prologo = {
    music(s, map) {
      if (map === 'fuga') return 'chase';
      return s.flags.solComido ? 'tension' : 'vila';
    },
    amb(s, map) {
      return map === 'fuga' || s.flags.solComido ? 'wind' : 'fair';
    },
    darkness(s, map) {
      if (map === 'fuga') return 0.45;
      return s.flags.solComido ? 0.55 : 0;
    },
    objective(s, W) {
      const f = s.flags;
      if (W && W.mapId === 'fuga') return 'Corra até a Porteira, ao norte!';
      if (!f.tarefaCordao) return '';
      if (nCordoes() < 3) return 'Pendure os folhetos nos cordões da feira (' + nCordoes() + '/3)';
      if (!f.pelejaSabia) return 'Fale com o Cego Sabiá, no palanque';
      if (f.solComido && !f.borroesOk) return 'Espante os Borrões da feira (' + Math.min(6, f.borroesMortos || 0) + '/6)';
      if (f.borroesOk) return 'Fuja para o norte!';
      return '';
    },
    onMapEnter(W, map) {
      const f = F();
      if (map === 'vila') {
        if (!f.introVila) {
          f.introVila = true;
          W.runScript([
            { bars: true },
            { cam: { pt: 'norte', dy: -120 }, t: 0 },
            { fade: 'in', t: 1.6 },
            { wait: 0.4 },
            { cam: 'zab', t: 2.8 },
            { emote: 'zab', e: 'nota' },
            'zab.feliz|Domingo de feira em Vila Rima! Cheiro de rapadura, zabumba no pé do ouvido e folheto novinho pra vender. Arretado!',
            { cam: 'filo', t: 1.2 },
            'filo.feliz|Zabelê! Ô Zabelê, minha fia! Vem cá!',
            { move: 'zab', to: { rel: 'filo', dx: 56, dy: 6 }, speed: 180 },
            { face: 'zab', dir: 'left' },
            { face: 'filo', dir: 'right' },
            'filo.feliz|Os folhetos novos chegaram da gráfica e os cordões tão tudo pelado!',
            'filo|Pendura um folheto em cada um dos *três cordões* da feira, que hoje o povo vem com dinheiro no bolso!',
            'zab.determinado|Deixa comigo, Dona Filó. Três folhetos, três cordões. É moleza!',
            'filo.sarcastico|Moleza é rapadura no sol. Vai, vai!',
            { flag: 'tarefaCordao' },
            { camFollow: true },
            { bars: false },
            { checkpoint: true },
            { hint: 'para andar', keys: ['move'], t: 5 },
          ]);
        } else if (f.solComido && !f.borroesOk) {
          // voltou de uma derrota: borrões de novo
          G.Story.chapters.prologo.spawnBorroes(W, true);
        }
        if (f.fugaComecou) {
          W.voidY = 25.5 * T;
        }
      }
      if (map === 'fuga') {
        W.chase = { t: 0, v: 55, stopped: false, chickT: 2, debT: 3 };
        W.cam.mode = 'chase';
        W.cam.y = W.player.y - 160;
        W.voidY = W.player.y + 220;
        W.checkpoint();
        W.runScript([
          { bars: false },
          { fade: 'in', t: 0.4 },
          { toast: 'FUJA! A Traça está comendo a feira!', t: 2.5 },
          { hint: 'Esquive para pular buracos', keys: ['dodge'], t: 6 },
        ]);
      }
    },
    spawnBorroes(W, quick) {
      const pts = [[18, 17], [26, 17], [22, 21], [16, 20], [28, 20], [22, 14]];
      pts.forEach(([x, y], i) => {
        const e = G.Enemies.create({ kind: 'borrao', x: x * T + 24, y: y * T + 36, spawnT: quick ? 0.3 : 0.6 + i * 0.35, aggro: 600 });
        e.fromSky = true;
        W.add(e);
      });
      F().borroesMortos = 0;
    },
    onCordao(W, c) {
      const n = nCordoes();
      Au.sfx('pickup');
      const lines = [
        'moca|Folheto novo! Tem romance? Tem peleja? Tem assombração?',
        'vend|Ó o folheto da Zabelê! Esse vende que nem água em dia de sol.',
        'meni|Tia Zabelê, esse aí tem desenho de dragão?',
      ];
      if (n < 3) {
        W.toast('Folheto pendurado! (' + n + '/3)', 2);
        if (Math.random() < 0.7) W.runScript([U.pick(lines)]);
      } else {
        W.runScript([
          'zab.feliz|Pronto! Três cordões cheinhos de folheto. Hoje a feira vai ser boa.',
          { cam: 'filo', t: 0.8 },
          'filo.feliz|ZABELÊ! O *Cego Sabiá* tá te chamando lá no palanque! Diz que tu tá muito metida a poeta!',
          { camFollow: true },
          { flag: 'tarefaSabia' },
        ]);
      }
      void c;
    },
    onEnemyKilled(W, e) {
      const f = F();
      if (W.mapId === 'vila' && f.solComido && !f.borroesOk && e.type === 'borrao') {
        f.borroesMortos = (f.borroesMortos || 0) + 1;
        W.refreshObjective(false);
        if (f.borroesMortos === 2) W.showHint('Esquiva: fica invencível por um instante', ['dodge'], 5);
        if (f.borroesMortos >= 6) {
          f.borroesOk = true;
          W.refreshObjective();
          W.runScript(scripts.feiraComida());
        }
      }
    },
    onStamp(W) {
      if (W.qte === 'stamp') W.qteDone = true;
    },
    onTrigger(W, id) {
      if (id === 'fimFuga' && !F().fugaFim) {
        F().fugaFim = true;
        W.runScript(scripts.porteira());
      }
    },
    update(W, dt) {
      if (W.voidTarget != null && W.voidY != null && W.mapId === 'vila') {
        W.voidY = U.approach(W.voidY, W.voidTarget, dt * 120);
      }
      if (W.later != null) {
        W.later -= dt;
        if (W.later <= 0) W.later = null;
      }
      const ch = W.chase;
      if (W.mapId !== 'fuga' || !ch) return;
      const p = W.player;
      const H = G.H;
      if (ch.stopped) {
        if (ch.qteVoid && !W.voidStop) W.voidY = Math.max(p.y + 60, W.voidY - dt * 18);
        return;
      }
      if (W.locked() && W.scripts.some((s) => s.q.length > 3)) return;
      ch.t += dt;
      ch.v = Math.min(128, 55 + ch.t * 2.6);
      // câmera sobe sozinha
      const top = H / 2;
      W.cam.y = Math.max(top, Math.min(W.cam.y - ch.v * dt, p.y - 20));
      W.cam.x += (p.x - W.cam.x) * Math.min(1, dt * 3);
      W.cam.x = U.clamp(W.cam.x, G.W / 2, W.map.w * T - G.W / 2);
      // a boca branca sobe
      W.voidY = Math.min(W.voidY - ch.v * 0.97 * dt, W.cam.y + H / 2 + 16);
      // jogadora não sai por cima
      if (p.y < W.cam.y - H / 2 + 50) p.y = W.cam.y - H / 2 + 50;
      // alcançada pela Traça
      if (p.y > W.voidY - 16 && p.state !== 'dead') {
        W.hurtPlayer(1, p.x, p.y + 30);
        Au.sfx('chomp');
        let ny = W.voidY - 130;
        for (let k = 0; k < 8 && W.solidAt(p.x, ny); k++) ny -= 24;
        p.y = ny;
        p.inv = Math.max(p.inv, 1.4);
      }
      // galinhas atravessando
      ch.chickT -= dt;
      if (ch.chickT <= 0) {
        ch.chickT = 2.5 + Math.random() * 2.5;
        const left = Math.random() < 0.5;
        const y = p.y - 150 - Math.random() * 160;
        const c = new G.Ent.Critter({ char: 'galinha', x: left ? 3.5 * T : 18.5 * T, y, speed: 0 });
        c.goTo(left ? 18.5 * T : 3.5 * T, y + (Math.random() - 0.5) * 60, 150 + Math.random() * 60);
        c.dir = left ? 'right' : 'left';
        c.life = 6;
        c.update = function (dt2, W2) {
          this.baseUpdate(dt2);
          this.stepGoal(dt2, W2);
          this.phase += dt2 * 16;
          this.life -= dt2;
          if (!this.goal || this.life <= 0) this.dead = true;
          const pp = W2.player;
          if (U.dist(this.x, this.y, pp.x, pp.y) < 22 && pp.state !== 'dodge' && !this.bumped) {
            this.bumped = true;
            pp.kx = (pp.x - this.x) * 12;
            pp.ky = 60;
            Au.sfx('hit', { p: 1.6 });
            W2.fx.burst(this.x, this.y - 10, 6, { type: 'spark', size: 4, speed: 80, grav: 0 });
          }
        };
        W.add(c);
      }
      // entulho caindo do céu comido
      ch.debT -= dt;
      if (ch.debT <= 0) {
        ch.debT = Math.max(1.1, 2.4 - ch.t * 0.02);
        const x = U.clamp(p.x + (Math.random() - 0.5) * 260, 4 * T, 18 * T);
        const y = p.y - 110 - Math.random() * 180;
        if (!W.solidAt(x, y)) {
          W.add(new G.Ent.Telegraph({
            x, y, r: 36, delay: 1.1, dmg: 1,
            onBoom: (W2, tg) => {
              Au.sfx('thud');
              W2.fx.dust(tg.x, tg.y, 6, { size: 7 });
              W2.fx.burst(tg.x, tg.y - 10, 8, { type: 'paper', size: 5, speed: 120, grav: 250 });
              W2.shake(3, 0.15);
            },
          }));
        }
      }
    },
    drawOver(W, ctx) {
      if (W.mapId === 'fuga' && W.chase && !W.chase.stopped && !W.locked()) {
        const d = Math.max(0, W.voidY - W.player.y);
        if (d < 200) {
          ctx.save();
          ctx.globalAlpha = (1 - d / 200) * 0.35;
          ctx.fillStyle = C.red;
          ctx.fillRect(0, G.H - 30, G.W, 30);
          ctx.restore();
        }
      }
    },
  };
  const C = G.C;

  // ------------------------------------------------------------------ CAPÍTULO I
  chapters.cap1 = {
    music(s, map) {
      return map === 'serra' ? (s.flags.boss1 ? 'ending' : null) : 'sertao';
    },
    amb(s, map) {
      return map === 'serra' ? 'wind' : 'night';
    },
    darkness(s, map) {
      if (map === 'serra') return s.flags.boss1 ? 0.2 : 0.42;
      return Math.max(0.12, 0.62 - nLamps() * 0.15);
    },
    objective(s, W) {
      const f = s.flags;
      if (W && W.mapId === 'serra') return f.boss1 ? '' : 'Derrote o Capitão Mandacaru';
      if (nLamps() < 3) return 'Acenda os candeeiros da serra (' + nLamps() + '/3)';
      if (!f.boss1) return 'Suba a Serra do Chapéu (nordeste)';
      return '';
    },
    onMapEnter(W, map) {
      const f = F();
      if (map === 'sertao') {
        if (!f.cap1Intro) W.runScript(scripts.cap1Intro());
        const bod = W.find('bod');
        if (bod) {
          if (f.bodinhaEntregue) {
            const ze = W.find('ze');
            bod.x = ze.x + 30;
            bod.y = ze.y + 6;
            bod.home = { x: bod.x, y: bod.y };
            bod.speed = 20;
          } else if (f.bodinhaSegue) {
            bod.x = W.player.x - 30;
            bod.y = W.player.y;
            bod.followPlayer = true;
          }
        }
        if (f.portaoSol) {
          for (const b of W.ents) if (b.kind === 'block') {
            const slot = { S: 30, O: 32, L: 34 }[b.letter];
            b.x = slot * T + T / 2;
            b.y = 15 * T + T - 8;
            b.onSlot = true;
          }
          for (const s2 of W.ents) if (s2.kind === 'slot') s2.filled = true;
        }
      }
      if (map === 'serra' && !f.boss1) {
        W.checkpoint();
        W.runScript(scripts.bossMandacaru());
      }
    },
    onLampLit(W, lamp) {
      if (!lamp.count) return;
      const n = nLamps();
      W.shake(3, 0.3);
      if (n === 1) W.runScript(['nan.feliz|Luz! A escuridão recuou um bocadinho. Mais dois, senhorita.']);
      else if (n === 2) W.runScript(['nan|Só falta um. Eu já sinto até cheiro de sol.']);
      else if (n >= 3 && !F().serraAberta) W.runScript(scripts.serraAbre());
    },
    onBlockMoved(W) {
      if (F().portaoSol) return;
      const slots = W.ents.filter((e) => e.kind === 'slot');
      const blocks = W.ents.filter((e) => e.kind === 'block');
      let ok = 0;
      for (const s2 of slots) {
        const b = blocks.find((bb) => Math.abs(bb.x - s2.x) < 10 && Math.abs(bb.y - 8 - (s2.y - T * 0.75 + T - 16)) < 30);
        s2.filled = !!(b && b.letter === s2.letter);
        if (b) b.onSlot = s2.filled;
        if (s2.filled) ok++;
      }
      if (ok === 3) {
        F().portaoSol = true;
        Au.jingle('verse');
        W.runScript([
          { wait: 0.4 },
          { toast: 'S — O — L! O portão se abriu!' },
          'nan.feliz|S, O, L. O nome do que foi comido. Muito bem, senhorita!',
        ]);
      } else if (ok > 0) Au.sfx('pickup');
    },
    onBossDefeated(W, b) {
      F().boss1 = true;
      W.runScript(scripts.mandacaruVence());
      void b;
    },
    update(W) {
      const f = F();
      if (W.mapId === 'sertao' && f.bodinhaSegue && !f.bodinhaEntregue && !W.locked()) {
        const bod = W.find('bod'), ze = W.find('ze');
        if (bod && ze && U.dist(bod.x, bod.y, ze.x, ze.y) < 110) W.runScript(scripts.bodinhaVolta());
      }
    },
  };

  // ------------------------------------------------------------------ CAPÍTULO II
  chapters.cap2 = {
    music(s, map) {
      return map === 'almofada' ? null : 'acude';
    },
    amb() {
      return 'water';
    },
    darkness(s, map) {
      if (map === 'almofada') return 0.3;
      return Math.max(0.2, 0.5 - nBells() * 0.08);
    },
    objective(s, W) {
      const f = s.flags;
      if (W && W.mapId === 'almofada') return f.boss2 ? '' : 'Derrote a Dona Renda';
      if (nBells() < 3) return 'Toque os sinos de bilro para erguer as pontes (' + nBells() + '/3)';
      if (!f.boss2) return 'Siga pela ponte norte até a Almofada Grande';
      return '';
    },
    onMapEnter(W, map) {
      const f = F();
      if (map === 'acude' && !f.cap2Intro) W.runScript(scripts.cap2Intro());
      if (map === 'almofada' && !f.boss2) {
        W.checkpoint();
        W.runScript(scripts.bossRenda());
      }
    },
    onBellRung(W, bell) {
      const n = nBells();
      const pt = { x: bell.bridge[0] * T + bell.bridge[2] * T / 2, y: (bell.bridge[1] + bell.bridge[3] / 2) * T };
      const steps = [{ bars: true }, { wait: 0.3 }, { cam: [pt.x, pt.y], t: 1.2 }, { wait: 1.4 }];
      if (n === 1) steps.push('zab.surpreso|Uma ponte! Feita de renda... e aguenta o peso?', 'nan|Aguenta, senhorita. Renda boa é igual promessa: fina, mas firme.');
      else if (n === 2) steps.push('nan|Mais uma. Falta um sino... deve estar mais ao norte, perto das teias.');
      else steps.push('zab.determinado|A ponte grande, do norte! Lá deve estar a Dona Renda.', 'nan.pensativo|E a Traça, se tivermos azar. Ou sorte. Ainda não decidi.');
      steps.push({ camFollow: true }, { bars: false });
      W.runScript(steps);
    },
    onItem(W, item) {
      if (item === 'bilroOuro') {
        Au.jingle('verse');
        W.runScript(['narr|Você encontrou o *Bilro de Ouro*! Leve-o para Tetê e Lalá, na margem.']);
      }
    },
    onBossDefeated(W) {
      F().boss2 = true;
      W.runScript(scripts.rendaVence());
    },
  };

  // ------------------------------------------------------------------ CAPÍTULO III
  chapters.cap3 = {
    music(s, map) {
      return map === 'tipografia' ? null : 'cidade';
    },
    amb() {
      return 'city';
    },
    darkness(s, map) {
      if (map === 'tipografia') return s.flags.boss3 ? 0.15 : 0.35;
      return Math.max(0.2, 0.5 - nPrensas() * 0.08);
    },
    objective(s, W) {
      const f = s.flags;
      if (W && W.mapId === 'tipografia') {
        if (W.defense) return 'Proteja o Cego Sabiá enquanto ele toca!';
        return f.boss3 ? '' : 'Derrote a Prensa-Mor do Coronel';
      }
      if (nPrensas() < 3) return 'Sabote as prensas do Coronel (' + nPrensas() + '/3)';
      if (!f.boss3) return 'Invada a Tipografia (norte)';
      return '';
    },
    onMapEnter(W, map) {
      const f = F();
      if (map === 'cidade' && !f.cap3Intro) W.runScript(scripts.cap3Intro());
      if (map === 'tipografia') {
        if (!f.boss3) {
          W.checkpoint();
          W.runScript(scripts.bossCoronel());
        } else if (!f.margemAberta) {
          // voltou depois de perder a defesa
          const b = W.boss;
          if (b) {
            b.defeated = true;
            b.stage = 'coronel';
            b.cx = b.x + 80;
            b.cy = b.y + 40;
            b.hp = 0;
          }
          W.spawn({ kind: 'npc', char: 'firmino', id: 'fir', pt: 'mesa', dir: 'down', solid: false });
          W.spawn({ kind: 'npc', char: 'sabia', id: 'sab', pt: 'centro', dir: 'down', solid: false });
          W.spawn({ kind: 'npc', char: 'candinha', id: 'can', pt: 'centro', dx: 70, dy: 100, dir: 'up', solid: false });
          W.runScript([{ wait: 0.5 }, 'sab.determinado|De novo, menina! A viola não cansa!', { do: (W2) => chapters.cap3.startDefense(W2) }]);
        }
      }
    },
    onPrensa(W) {
      const n = nPrensas();
      Au.play('cidade');
      if (n >= 3 && !F().tipografiaAberta) W.runScript(scripts.tipografiaAbre());
      else W.runScript(['nan.feliz|Uma prensa a menos! "Fim" nenhum se imprime sozinho, Coronel!']);
      W.checkpoint();
    },
    onItem(W, item) {
      if (item === 'contrato') {
        Au.jingle('verse');
        W.runScript(['narr|Você encontrou o *Contrato do Biu*. "O abaixo-assinado jura ser jagunço para sempre, ou até o Coronel enjoar."']);
      }
    },
    onBossDefeated(W) {
      F().boss3 = true;
      W.runScript(scripts.coronelVence());
    },
    startDefense(W) {
      const sab = W.find('sab');
      for (const e of W.ents) if (e.kind === 'enemy' && !e.boss) e.dead = true;
      sab.pose = 'play';
      sab.lookAt = false;
      sab.dir = 'down';
      W.defense = { t: 0, dur: 42, hp: 12, max: 12, spawnT: 1.2, sab, hitCD: 0 };
      Au.play('peleja', { bpm: 116, restart: true });
      W.refreshObjective();
      W.toast('Proteja o Cego Sabiá!', 2.5);
    },
    update(W, dt) {
      const D = W.defense;
      if (!D || W.locked()) return;
      D.t += dt;
      const sab = D.sab;
      if (Math.random() < dt * 2) W.fx.add({ type: 'letter', x: sab.x + (Math.random() - 0.5) * 40, y: sab.y - 50, vx: (Math.random() - 0.5) * 30, vy: -50, z: 0, grav: 0, life: 1.4, size: 4, ch: '♪', color: G.C.ink });
      D.spawnT -= dt;
      if (D.spawnT <= 0 && D.t < D.dur - 2) {
        D.spawnT = Math.max(0.9, 2.3 - D.t * 0.03);
        const A = W.arena;
        const a = Math.random() * U.TAU;
        const x = U.clamp(A.x + Math.cos(a) * A.r * 0.95, 3 * T, 27 * T), y = U.clamp(A.y + Math.sin(a) * A.r * 0.7, 3 * T, 19 * T);
        const kind = U.pick(D.t < 12 ? ['rascunho', 'letra'] : ['rascunho', 'letra', 'borrao', 'jagunco']);
        const e = G.Enemies.create({ kind, x, y, spawnT: 0.5, aggro: 2000 });
        e.target = sab;
        e.lootR = [0, 1];
        W.add(e);
      }
      // ataques ao cantor
      D.hitCD -= dt;
      for (const e of W.ents) {
        if (e.kind !== 'enemy' || e.dead || e.boss || e.spawnT > 0) continue;
        if (U.dist(e.x, e.y, sab.x, sab.y) < 34 && D.hitCD <= 0) {
          D.hp--;
          D.hitCD = 0.6;
          sab.flash = 0.25;
          Au.sfx('hurt');
          W.shake(3, 0.2);
          const a = Math.atan2(e.y - sab.y, e.x - sab.x);
          e.kx = Math.cos(a) * 300;
          e.ky = Math.sin(a) * 300;
        }
      }
      if (D.hp <= 0) {
        W.defense = null;
        for (const e of W.ents) if (e.kind === 'enemy' && !e.boss) e.dead = true;
        Au.stop(0.5);
        sab.pose = null;
        W.runScript(scripts.defesaFalhou());
      } else if (D.t >= D.dur) {
        W.defense = null;
        for (const e of W.ents) {
          if (e.kind === 'enemy' && !e.boss) {
            e.dead = true;
            W.fx.burst(e.x, e.y - 10, 8, { type: 'ink', speed: 120, size: 3 });
          }
        }
        F().margemAberta = true;
        sab.pose = null;
        W.runScript(scripts.margemAbre());
      }
    },
    drawOver(W, ctx) {
      const D = W.defense;
      if (!D) return;
      const w = 320, x = G.W / 2 - w / 2, y = G.H - 70;
      ctx.save();
      ctx.fillStyle = 'rgba(29,23,18,0.85)';
      ctx.fillRect(x - 8, y - 30, w + 16, 58);
      ctx.fillStyle = G.C.paperLight;
      ctx.font = G.font(15, 'title');
      ctx.textAlign = 'center';
      ctx.fillText('A Margem se abre em ' + Math.ceil(D.dur - D.t) + 's', G.W / 2, y - 10);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = G.C.gold;
      ctx.fillRect(x, y, w * (D.hp / D.max), 12);
      ctx.strokeStyle = G.C.paperLight;
      ctx.strokeRect(x, y, w, 12);
      ctx.font = G.font(12, 'body', 'italic');
      ctx.fillText('fôlego do Cego Sabiá', G.W / 2, y + 26);
      ctx.restore();
    },
  };

  // ------------------------------------------------------------------ CAPÍTULO FINAL
  chapters.final = {
    music(s, map) {
      return map === 'ultima' ? null : 'margem';
    },
    amb() {
      return 'void';
    },
    darkness() {
      return 0;
    },
    objective(s, W) {
      if (W && W.mapId === 'ultima') return 'Enfrente a Traça';
      return 'Chegue à Última Página (lembranças: ' + nEcos() + '/4)';
    },
    onMapEnter(W, map) {
      const f = F();
      if (map === 'margem' && !f.finalIntro) W.runScript(scripts.finalIntro());
      if (map === 'ultima') {
        W.checkpoint();
        W.runScript(scripts.bossTraca());
      }
    },
    onEco(W, eco) {
      const mem = {
        1: [
          ['luz|Firmino! Tu vai passar o dia todo rabiscando? Vem ver o sol nascer, homem!', 'firJ|Tô escrevendo o sol, Luzia.', 'luz|Besteira. O sol a gente não escreve. A gente *espia*.'],
          'nan.triste|...Eu lembro dessa manhã. Ele derrubou tinta na toalha de tanto rir.',
        ],
        2: [
          ['luz|Recortei um sol de papel pra pendurar na varanda. Pra quando tu esquecer de olhar pra cima.', 'firJ|E precisa? Tu já é o sol desta casa.', 'luz|Luz de verdade é a que *anda*, Firmino. No pé do vaqueiro, na asa do carcará, na boca do povo.'],
          'zab.pensativo|"Luz de verdade é a que anda"... Eu já li isso em algum lugar.',
        ],
        3: [
          ['narr|Uma fogueira de São João. Bandeirinhas. Uma cadeira de balanço, perto demais do fogo, porque ela sente frio.', 'luz|Promete uma coisa? Quando eu for... não me deixa no escuro.', 'firJ|Luzia...', 'luz|Me escreve num versinho. Só um. Assim eu fico.', 'firJ|...Eu prometo.'],
          'zab.triste|Ele prometeu. E não conseguiu cumprir.',
        ],
        4: [
          ['narr|Uma gaveta aberta. Cem folhas amassadas. Uma lamparina se apagando.', 'firJ|Não sai. Não sai, Luzia. Toda rima que eu acho parece te machucar...', 'narr|No fundo da gaveta, entre os rascunhos, alguma coisa se mexe. Duas antenas. Um olho de gente.'],
          'nan.triste|Foi ali que ela nasceu. Da saudade que não coube no papel.',
        ],
      }[eco.fid];
      if (!mem) return;
      const steps = [{ bars: true }, { music: 'sad' }, { do: (W2) => W2.showPanel('lembranca' + eco.fid, 999, { skip: false }) }];
      for (const l of mem[0]) steps.push(l);
      steps.push({ do: (W2) => { W2.panel = null; } }, { music: 'margem' }, mem[1], { bars: false });
      W.runScript(steps);
    },
    onBossDefeated(W) {
      F().boss4 = true;
      W.runScript(scripts.tracaVence());
    },
  };

  G.Story = {
    speakers, abilities, verses, CH, people, pelejas, RIMAS, shop, scripts, chapters, talk, cleanse,
    nCordoes, nLamps, nBells, nPrensas, nEcos,
  };
})();
