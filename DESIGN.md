# PELEJA — Zabelê e a Traça que Comeu o Sol

> *Documento de design do jogo. Todas as decisões criativas abaixo foram tomadas do zero para este projeto.*

---

## 1. Conceito em uma frase

Uma **aventura de ação em visão de cima** que se passa **dentro de um folheto de cordel**, desenhada inteiramente no estilo **xilogravura**, onde as brigas contra chefes terminam num **duelo de repente rítmico** (a *Peleja*): você vence acertando, no tempo da viola, as palavras que **rimam**.

## 2. Pilares

| Pilar | Como aparece no jogo |
|---|---|
| **O mundo é um livro** | O chão é papel, o sol é carimbo, cada capítulo é impresso em papel de uma cor diferente (amarelo, azul, rosa… e o negativo, na Margem). |
| **Rima é poder** | A tinta da Traça só sai de quem perde uma *peleja*. O jogador **participa** das cenas mais importantes da história cantando. |
| **Xilogravura viva** | Tudo é desenhado por código: preto de tinta, papel creme, vermelho de destaque, marcas de goiva e o "traço vivo" (linhas que tremem como animação feita à mão). |
| **Saudade que vira luz** | A vilã não é má: é o luto de um poeta que não conseguiu terminar um poema. |

## 3. Gênero e estilo de jogo

- **Aventura de ação top-down** (visão de cima, 8 direções) com exploração, quebra-cabeças leves, inimigos e chefes.
- **Duelo de repente (Peleja)**: minijogo de ritmo em 4 pistas. Palavras caem no compasso da viola; você só deve acertar as que **rimam** com o verso do adversário. Acertar palavra errada é "rima pobre"; deixar passar a certa é "perder o fio".
- **Sequências especiais**: fuga com rolagem automática (a feira sendo comida), defesa de personagem (proteger o Cego Sabiá enquanto ele toca), escolha final com três desfechos.

## 4. Mundo: o Sertão de Papel

Um folheto escrito pelo **Mestre Firmino Pena-Branca**. Tudo nele é tinta sobre papel.

| Capítulo | Local | Papel | Clima |
|---|---|---|---|
| Prólogo | **Vila Rima** — feira, igreja, palanque de cantoria | amarelo | manhã de feira → o sol é comido |
| I | **Sertão das Letras Soltas** — lajedos, vale dos ossos, portão de letras, Serra do Chapéu | ocre | crepúsculo eterno, candeeiros apagados |
| II | **Açude das Rendas** — palafitas, pontes de renda, sinos de bilro | azul | noite de lua, água parada |
| III | **Cidade de Papelão** — ruas de caixa, cartazes do Coronel, prensas | rosa | luz de poste, propaganda |
| Final | **A Margem** — o branco onde vão as histórias sem fim | negativo (preto) | silêncio, rascunhos flutuando |

## 5. Personagens

| Personagem | Visual | Personalidade / fala |
|---|---|---|
| **Zabelê** (protagonista) | chapéu de couro com meia-lua e estrela, trança preta com fita vermelha, gibão costurado, cordão de folhetos cruzado no peito, bolsa com folhetos coloridos | corajosa, curiosa, debochada. "Oxe!", "Vixe!", "Arretado!" |
| **Seu Nanquim** | tinteiro de cristal com pena no gargalo, monóculo, bigode desenhado no vidro, perninhas de polaina | ranzinza, formal como tabelião ("Consta nos autos…"), secretamente sentimental. Era o tinteiro do Poeta |
| **Cego Sabiá** | alto, barba branca, óculos escuros redondos, chapéu de palha com um sabiá de peito vermelho, viola de dez cordas | fala **sempre em verso**. Mentor. Sacrifica a própria voz para abrir a Margem |
| **Dona Filó** | turbante alto, argolas grandes, saia rodada, burrinha Lorota carregada de folhetos | comerciante acelerada: "meu fi", "minha fia". Loja de melhorias |
| **Seu Vírgula** | chapéu em forma de vírgula, bigode de caracol, sobretudo comprido | fala, cheio, de, pausas. Aparece em todo lugar e dá pistas do final verdadeiro |
| **Vovó Candinha** | coque, xale, bengala e cachimbo fumegante | conta lendas e história do Poeta |
| **Zé Pipoco** | menino de cuia, camisa grande, rojões na mão | afobado; perdeu a cabrita Bodinha |
| **Tião Vaqueiro** | gibão de couro, chapéu de vaqueiro | lacônico, guarda o Pouso do sertão |
| **Tetê e Lalá** | gêmeas rendeiras (uma alta e magra, outra baixa e redonda), xales de renda | uma completa a frase da outra |
| **Seu Anzol** | pescador de chapéu mole e vara | exagerado, só fala por metáfora de pesca |
| **Biu** | jagunço de papelão, chapéu de jornal | quer largar o Coronel e virar figurante |
| **Juca Manchete** | jornaleiro de boina | grita manchetes absurdas |
| **Mestre Firmino** | terno de linho branco, cabelo arrepiado como risco de pena, óculos redondos, caderno | fala baixo, em prosa: perdeu a rima |
| **Luzia** | desenhada só em tinta vermelha (memórias) | a esposa falecida do poeta — "a luz" |

### Chefes

1. **Capitão Mandacaru** — cangaceiro-cacto de chapéu de meia-lua e cartucheiras de espinho. Chuva de espinhos, carreira, pilares de cacto.
2. **Dona Renda, a Rendeira das Mil Agulhas** — velhinha de seis braços sobre uma almofada de bilros que anda. Escudo de bilros (quebra com o Pregador), linhas de ponto-cruz, novelo gigante.
3. **Coronel Papelão e a Prensa-Mor** — coronel de caixa de papelão pilotando uma prensa de pernas mecânicas. Carimbos "CONFISCADO", aviões de papel teleguiados, válvulas que se destroem com o Carimbo.
4. **A Traça** — mariposa gigante com asas de páginas mordidas, antenas de pena e um olho de gente. Come o chão da arena, dispara letras soltas, espiral de tinta.

### Inimigos

Borrão (mancha de tinta saltitante) · Calango-Tipo (lagarto de tipos de chumbo que dá bote em linha reta) · Urubu de Papel (dobradura que mergulha) · Mandacaruzinho (torreta de espinho) · Novelo · Agulheira (vespa-agulha) · Peixe-Tinta · Soldado-Carimbo · Jagunço de Papelão (atira aviõezinhos) · Rascunho (bola de papel que se desamassa em letras) · Letra Solta.

## 6. História

**Prólogo.** Zabelê vende folhetos na feira de Vila Rima. Pendura os folhetos, desafia o Cego Sabiá numa peleja amistosa… e o céu escurece: uma traça gigante **come o sol**. Borrões pingam do buraco no céu. A página começa a ser comida de baixo pra cima; Zabelê foge pela feira. Na Porteira, conhece **Seu Nanquim**, que lhe dá o **Carimbo** e revela: *o mundo é um folheto; o autor parou de escrever; e história sem final vira comida de traça.*

**Capítulo I.** Sem sol, os candeeiros da serra apagaram. Zabelê reacende os três (lajedo, vale dos ossos e o portão das letras S-O-L), abre a Serra do Chapéu e enfrenta o **Capitão Mandacaru**, reescrito pela tinta da Traça. Vencida a peleja, ele floresce, dá o **Pregador** e conta: *a Traça tinha um olho de gente*.

**Capítulo II.** No Açude das Rendas, Zabelê toca os sinos de bilro para erguer pontes de renda e chega à **Dona Renda**, que teceu uma renda para esconder o céu e acabou enredada. Liberta, ela revela: *o Poeta não morreu — foi levado pelo Coronel. E parou de escrever quando "a Luz dele" se apagou.*

**Capítulo III.** Na Cidade de Papelão, Zabelê sabota as prensas que imprimem o "final" do Coronel ("…e o Coronel foi dono de tudo. FIM."), derrota a **Prensa-Mor** e encontra **Mestre Firmino** acorrentado à escrivaninha. **Reviravolta:** a Traça nasceu dos cem rascunhos amassados do poema que Firmino tentou escrever para **Luzia**, sua esposa morta. A Traça arranca o teto, rouba a Última Página e foge para a Margem. O Cego Sabiá toca para abrir a passagem enquanto Zabelê o protege — e, no último acorde, perde a voz.

**Final.** Na Margem (o mundo em negativo), Zabelê atravessa as lembranças de Firmino e Luzia até a Última Página. Derrota a Traça, vence a última peleja… e precisa decidir.

## 7. Finais

| Final | Condição | O que acontece |
|---|---|---|
| **PONTO FINAL.** | carimbar "FIM" na Traça | O mundo é salvo e o sol é redesenhado, mas o livro se fecha: Vila Rima para no tempo. Agridoce. |
| **RETICÊNCIAS…** | deixar a Traça ir | Zabelê acompanha a Traça na beira da página. O sol não volta, mas o povo acende mil lanternas e o Poeta volta a escrever devagar. Melancólico e terno. |
| **VÍRGULA,** *(verdadeiro)* | ter os **9 Versos Perdidos** e recitá-los | Firmino lê o poema "O Sol de Papel". A Traça, que como toda mariposa só queria luz, voa até os versos e **vira o novo sol**, com asas no lugar dos raios. O Sabiá volta a cantar. "FIM, não. Vírgula." |

## 8. Gameplay

### Controles (teclado / controle)

| Ação | Teclado | Controle |
|---|---|---|
| Mover | WASD / Setas | analógico / direcional |
| Chicote de Cordel (combo de 3) | J ou Z | A |
| Esquiva (rolamento, invencível) | K, X ou Shift | B |
| Carimbo (onda de choque, gasta tinta) | L ou C | Y |
| Pregador (tiro à distância) | I ou V | RB |
| Interagir / falar | E, Espaço ou Enter | X |
| Caderno (missão, mapa, versos…) | Tab ou Q | Select |
| Pausa | Esc ou P | Start |
| Peleja (4 pistas) | ← ↓ ↑ → (ou A S W D) | direcional |

### Progressão
- **Rimas** (moeda) caem dos inimigos → loja da Dona Filó: Remendo de Coração, Tinteiro Maior, Cordão Trançado, Alpargata Ligeira, Garrafada.
- **Habilidades por história**: Carimbo (prólogo), Pregador (cap. I), Linha de Renda (cap. II, alcance do chicote).
- **Corações extras** ao vencer chefes.
- **9 Versos Perdidos** escondidos (baús, missões secundárias, rochas rachadas) — formam o poema "O Sol de Papel" e liberam o final verdadeiro. Ficam guardados para sempre no Caderno.
- **Candeeiros** = pontos de controle + reduzem a escuridão do capítulo.

### Vitória e derrota
- Coração zerado → **"O FOLHETO RASGOU!"** (tela rasgando) → tentar de novo do último candeeiro.
- Perder a peleja → refazer a peleja.
- Chefe vencido → **PELEJA VENCIDA!**; fim de capítulo → tela com tempo, rimas, versos e acertos.

## 9. Identidade visual e sonora

- **Paleta**: papel creme/colorido por capítulo, tinta quase preta, vermelho-urucum, sépia para pele. No capítulo final tudo inverte (negativo de impressão).
- **Escuridão hachurada**: a falta de sol é desenhada como hachura de xilogravura, furada pela luz dos candeeiros.
- **Transições**: virada de página, íris de mancha de tinta, papel rasgando.
- **Música procedural (Web Audio)**: baião (zabumba, triângulo, sanfona), xote com pífano, valsa com rabeca, marcha, frevo para chefes, repente de viola para as pelejas, drones na Margem. Tudo sintetizado em tempo real.
- **Efeitos**: estalo do cordão, baque do carimbo, chiado de página, voz "bip" diferente para cada personagem, mastigar da Traça, bater de asas, aplausos do povo.
