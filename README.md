# PELEJA — Zabelê e a Traça que Comeu o Sol

Uma aventura de ação em visão de cima que se passa **dentro de um folheto de cordel**, toda desenhada em estilo **xilogravura**, com chefes que terminam num **duelo de repente rítmico** — a *Peleja* — onde você vence acertando, no tempo da viola, as palavras que **rimam**.

> Numa feira de Vila Rima, uma traça gigante come o sol. Zabelê, a menina que vende folhetos, descobre que o mundo inteiro é um livro, que o autor parou de escrever… e que história sem final vira comida de traça.

## Como jogar

Não precisa instalar nada. É HTML + JavaScript puro, sem dependências:

- **Jeito mais simples:** abra o arquivo `index.html` no navegador (Chrome, Edge ou Firefox).
- **Ou por um servidor local** (recomendado): na pasta do projeto rode `npx serve .` ou `python3 -m http.server` e abra o endereço mostrado.

Clique na tela / aperte qualquer tecla para liberar o som (a música é gerada em tempo real).

### Controles

| Ação | Teclado | Controle |
|---|---|---|
| Andar | WASD / Setas | analógico / direcional |
| Chicote de Cordel (combo de 3) | J ou Z | A |
| Esquiva (invencível, pula buracos) | K, X ou Shift | B |
| Carimbo (onda de choque, gasta tinta) | L ou C | Y |
| Pregador (arremesso) | I ou V | RB |
| Falar / interagir | E, Espaço ou Enter | X |
| Caderno (missão, mapa, versos…) | Tab ou Q | Select |
| Pausa | Esc ou P | Start |
| **Peleja**: acertar a pista | ← ↓ ↑ → ou A S W D | direcional |

Também funciona com toque (direcional virtual à esquerda, botões à direita).

## O que tem no jogo

- **Prólogo + 3 capítulos + capítulo final**, cada um num papel de cor diferente (a Margem é o negativo da impressão).
- **Abertura cinematográfica** narrada em sextilhas de cordel e **cutscenes** com câmera, atores, expressões, quadros ilustrados e escolhas.
- **4 chefes** (Capitão Mandacaru, Dona Renda, Coronel Papelão & a Prensa-Mor, A Traça), cada um seguido de uma **Peleja** de 3–4 rodadas.
- **Sequências especiais**: fuga com rolagem automática, quebra-cabeça de pedras-letra, pontes de renda erguidas por sinos, prensas a sabotar, defesa do Cego Sabiá.
- **Progressão**: rimas (moeda), loja da Dona Filó, habilidades novas pela história, corações extras, candeeiros como pontos de controle.
- **9 Versos Perdidos** escondidos pelo mundo — juntos, liberam o **final verdadeiro**.
- **3 finais**: *PONTO FINAL.*, *RETICÊNCIAS…* e *VÍRGULA,*.
- Menu principal em forma de folhetos pendurados num cordão, configurações (volume, velocidade do texto, dificuldade, tremor, qualidade, ajuste de ritmo…), controles, **Caderno** (missão, mapa, versos, personagens, bestiário, finais), pausa, tela de derrota "O FOLHETO RASGOU!", fim de capítulo, créditos com cortejo dos personagens.
- **Tudo gerado por código**: nenhuma imagem ou arquivo de som — a arte é desenhada no canvas e a música (sanfona, zabumba, triângulo, pífano, rabeca, viola) é sintetizada com Web Audio.

O documento de design completo está em [`DESIGN.md`](DESIGN.md).

## Estrutura

```
index.html          ponto de entrada
css/style.css
js/core/            utilidades, entrada, áudio procedural, salvamento
js/gfx/             arte: papel e traços, personagens, criaturas, retratos, cenário, quadros, partículas
js/game/            mapas, entidades, inimigos, chefes, diálogos, cenas, história, mundo, peleja
js/ui/              menus, abertura, finais e créditos
js/main.js          laço principal, cenas, transições e fluxo do jogo
tools/              páginas de teste visual dos sprites (desenvolvimento)
```

O progresso é salvo automaticamente no navegador (candeeiros acesos, fim de capítulo e loja).
