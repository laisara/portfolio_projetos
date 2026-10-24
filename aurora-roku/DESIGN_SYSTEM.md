# Sistema de design — Aurora Roku

Interface de "dez pés" para TV: leitura a cerca de 3 m, navegação só por controle remoto.
Este documento descreve a interface **efetivamente implementada** (versão 0.2.0). Cada valor
abaixo existe no código; as referências de onde vieram as decisões estão na seção final.

A identidade é configurável: nome, cores e imagens de interface ficam centralizados (ver
[Como trocar a identidade](#como-trocar-a-identidade)).

## Princípios

1. **Imagem primeiro.** O banner ocupa a tela inteira; os textos ficam sobre uma região já
   escurecida na própria imagem (sem camada extra de textura).
2. **Densidade de TV, não de painel.** Banner + primeira fileira visíveis ao abrir; as demais
   fileiras vêm com a navegação. Pouco texto por cartão: título e uma linha.
3. **Foco inconfundível e uniforme.** Um só elemento focado por vez, sempre com mudança de forma
   **e** de cor.
4. **Bonito sem animação.** As animações só levam a posições finais definidas; a opção
   "Animações" desligada aplica essas posições na hora.
5. **Leve para o hardware.** Texturas no tamanho da saída HD, poucas imagens grandes ao mesmo
   tempo, nenhum laço de atualização.
6. **Original.** Arte procedural própria; nenhum logotipo, marca ou tela de terceiros.

## Grade e resolução

- Layout desenhado em **1920×1080** (`ui_resolutions=fhd`); o sistema escala para a saída do
  aparelho. O **Roku Express 3960X** tem interface de no máximo **720p**, então a escala é de 2/3.
- **Toda posição e todo tamanho são múltiplos de 3** (recomendação da Roku para FHD; escala para
  HD sem frações). O `tools/check-project.js` verifica.
- **Margem segura de 96 px** (5%) nas laterais; a barra superior respeita também a margem
  vertical de 54 px (5%) e ocupa y 54–135; o conteúdo começa abaixo disso. Fileiras e cartões **sangram até a borda direita** de propósito,
  para indicar continuação. Textos longos terminam antes de x=1056.

| Região | Posição (FHD) |
|---|---|
| Barra superior (marca + 7 abas) | y 54–135 |
| Banner: selo, título, metadados, sinopse | x 96, y 282–603 |
| Banner: ação principal / indicador de posição | y 615 / y 723 |
| Fileiras da tela inicial | cartões em x 96 (RowList em x 72 + 24 px de margem do item), a partir de y 795 (recolhidas: y 153) |
| Painel de informações (Filmes, Séries, Aplicativos, Biblioteca) | x 96, y 177–432; fileiras a partir de y 459, mesma grade de cartões do Início (passo 414 px) |
| Busca: teclado / texto digitado / resultados | x 96 y 189 / x 924 y 189 / x 96 y 615 (mesma grade de cartões) |
| Aviso (Toast) | centralizado, y 924 |

## Paleta

Definida em `source/shared/Theme.brs` (formato SceneGraph `0xRRGGBBAA`). O linter (`bslint`,
regra `color-format: never`) **proíbe cores fora desse arquivo**.

| Papel | Aurora Noturna (padrão) | Aurora Boreal | Uso |
|---|---|---|---|
| `background` | `#080B14` | `#06110F` | Fundo; base dos detalhes; escurecimento do banner |
| `surface` | `#151B2A` | `#12201E` | Painéis; placeholder de imagem |
| `surfaceRaised` | `#1E2638` | `#1A2C29` | Pílulas e teclas sem foco; trilho de progresso |
| `textPrimary` | `#F5F7FC` | `#F3FAF8` | Títulos e texto principal |
| `textSecondary` | `#A6AEC0` | `#9DB5AF` | Metadados, legendas, abas inativas |
| `accent` | `#79A9FF` | `#5FD9C0` | Foco, selos, progresso, indicador |
| `onAccent` | `#080B14` | `#04110E` | Texto sobre a cor de destaque |

**Gradientes:** um por tela de fundo (brilho discreto no canto superior) mais o escurecimento
embutido nas imagens de banner (esquerda e base). Não há gradientes em tempo de execução.

## Tipografia

Fonte do sistema Roku (nada embarcado). Tamanhos no design FHD, em `Theme_typeScale()`:

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `display` | 84 | Negrito | Título do banner e dos detalhes |
| `title` | 60 | Negrito | Painel de informações, "Busca", texto digitado, cabeçalho de Configurações |
| `heading` | 36 | Negrito | Rótulo das fileiras, seções do diagnóstico |
| `body` | 30 | Regular | Sinopses, avisos, texto das teclas |
| `label` | 27 | Regular/Negrito | Metadados, abas, títulos dos cartões |
| `caption` | 24 | Regular | Selos, legendas, metadados dos cartões |

Na saída 720p do aparelho-alvo cada tamanho vale 2/3: o menor texto fica com 16 px.

**Regras de legibilidade a distância** (aplicadas): nada abaixo de 24 pt no design; o título do
banner tem ≈2,8× o tamanho do texto corrido (84 × 30); nenhum texto sobre imagem sem
escurecimento prévio; sinopse com até 3 linhas no banner, 2 nos painéis e 4 nos detalhes.

**Contraste medido** (razão WCAG, calculada sobre os valores da paleta):

| Par | Aurora Noturna | Aurora Boreal |
|---|---|---|
| `textPrimary` / `background` | 18,3 : 1 | 18,1 : 1 |
| `textSecondary` / `background` | 8,8 : 1 | 8,8 : 1 |
| `textSecondary` / `surface` | 7,7 : 1 | 7,7 : 1 |
| `onAccent` / `accent` (botão com foco) | 8,4 : 1 | 11,2 : 1 |
| `accent` / `background` (selos) | 8,4 : 1 | 11,1 : 1 |

Todos acima de 7 : 1. O contraste sobre as **imagens** de banner não foi medido: depende da
imagem e do escurecimento (94% à esquerda); deve ser conferido no aparelho.

**Implementação:** `Ui_setFont()` em `components/shared/Ui.brs` é o único ponto que define
fontes: atribui `font:MediumBoldSystemFont` ou `font:MediumSystemFont` (padrão dos samples
oficiais) e ajusta o tamanho.

## Espaçamentos

| Token | Valor (FHD) | Uso |
|---|---|---|
| Entre cartões | 30 | `rowItemSpacing` |
| Entre fileiras | 30 | `itemSpacing` |
| Entre abas | 6 | Barra superior |
| Entre teclas | 9 | Teclado da Busca |
| Rótulo da fileira → cartões | 15 | `rowLabelOffset` |
| Imagem → título do cartão | 18 | |
| Botão → indicador de posição | 36 | Banner |

## Cartões (proporções)

| Tipo | Imagem | Proporção | Onde |
|---|---|---|---|
| **Cartão de conteúdo e de aplicativo** | **384×216** (arquivo 256×144) | **16:9** | Todas as fileiras |
| Tecla | 75×66 (largas: 369×66) | — | Teclado da Busca |

- Cantos arredondados de 18 px (12 px na saída HD), **dentro da própria imagem** (PNG com
  transparência), porque o SceneGraph não arredonda retângulos.
- Título (27, negrito) e metadados (24) **abaixo da imagem, na mesma largura** (384). Metadados
  curtos: "2024 · Drama". Títulos do catálogo têm no máximo 22 caracteres (testado).
- Cartões de **aplicativo** usam a mesma proporção e altura dos de conteúdo (consistência de
  fileira); o ícone é um glifo geométrico sobre gradiente.
- "Continue assistindo" mostra barra de progresso de 6 px na base da imagem.
- Falha de imagem: o retângulo `surface` e o título permanecem.

## Banner principal (carrossel)

| Elemento | Especificação |
|---|---|
| Imagem | Tela cheia (1280×720 escalada), com escurecimento embutido: 94% à esquerda, 92% na base |
| Selo | Caixa alta, `caption`, cor de destaque: "EM ALTA · CONTEÚDO DEMONSTRATIVO" |
| Título | `display` (84), até 1080 px de largura |
| Metadados | `label`, `textSecondary` |
| Sinopse | `body`, 780 px de largura, até 3 linhas |
| Ação | Uma pílula "Ver detalhes" (72 px de altura) |
| Indicador | Pontos de 12 px; o ponto atual vira pílula de 36×12 na cor de destaque |
| Navegação | **Manual**: esquerda/direita trocam o banner e param nas pontas; **sem avanço automático** |

Só **um** fundo de tela cheia fica carregado por vez (a troca de banner substitui o `uri`).

## Ícones

Estilo: **glifos geométricos de traço grosso** (arco de 3 cores na marca; reprodução, nota,
foto, jornal, nuvem, controle, chapéu de chef e halteres nos aplicativos), branco sobre
gradiente diagonal e um disco translúcido atrás. Sem texto, sem sombras, sem marcas reais.
Gerados por `tools/generate_assets.py`.

## Estados de foco, seleção e inatividade

| Elemento | Inativo | Selecionado/ativo | Com foco |
|---|---|---|---|
| Cartão | Imagem + texto | — | **Anel de 3 px na cor de destaque + escala 1,05×** (centro da imagem) |
| Botão / opção | Pílula `surfaceRaised`, texto `textPrimary` | — | **Pílula preenchida na cor de destaque**, texto `onAccent` |
| Aba | Texto `textSecondary`, sem fundo | Aba ativa (barra sem foco): pílula `surfaceRaised` | Aba realçada: pílula na cor de destaque |
| Tecla | Pílula `surfaceRaised` | — | Pílula na cor de destaque |
| Ponto do indicador | Disco branco 43% | Pílula na cor de destaque | — |

O anel dos cartões só aparece quando o próprio `RowList` tem o foco (`rowListHasFocus`),
como no sample oficial. **Um só elemento é destacado por vez.** O foco sempre é visível ao abrir
uma tela e ao voltar dos detalhes.

## Padrões de navegação

| Padrão | Regra |
|---|---|
| Eixos | **Vertical** entre fileiras; **horizontal** dentro da fileira (modelo "Browse") |
| Bordas | Esquerda/direita **param** nas pontas (sem laço); cima na primeira linha sobe para a barra de abas |
| Barra de abas | Entra sempre na **aba ativa**; OK troca a aba e mantém o foco na barra |
| Voltar | Detalhes → fecha; aba ≠ Início → Início; conteúdo do Início → barra; barra do Início → **sai** (sem confirmação) |
| Restauração | Ao fechar os detalhes, o foco volta ao mesmo cartão |
| Teclado | Grade 4×9 + linha de 2 teclas largas; vertical mantém a posição relativa; 38 teclas alcançáveis só com setas |
| Início | Banner ⇄ fileiras (Baixo/Cima) com recolhimento animado |

Mapa completo e diagrama de estados: [README.md](README.md).

## Transições e animações

| Transição | Duração | Curva | O que muda |
|---|---|---|---|
| Banner → fileiras (Início) | 0,3 s | `outCubic` | Conteúdo sobe 642 px, o banner esmaece, o fundo escurece 75% |
| Foco entre cartões | Controlada pelo `RowList` | — | Anel e escala acompanham `focusPercent` |
| Troca de banner | Imediata | — | Texto, indicador e imagem mudam juntos |
| Aviso (Toast) | Aparece na hora e some após 3 s | — | Visibilidade |

**Animações desligadas** (Configurações): a transição do Início aplica as mesmas posições finais
na hora. O foco dos cartões continua a ser desenhado pelo `RowList`. Não há animações em laço.

## Otimização de imagens

| Tipo | Arquivo | Memória de textura (4 B/pixel) |
|---|---|---|
| Cartão (16:9) | PNG 256×144 | ≈ 0,15 MB |
| Fundo de banner/detalhes | JPEG 1280×720 | ≈ 3,5 MB (1 carregado por vez, mais 1 nos detalhes) |
| Fundo das telas internas | JPEG 1280×720 | ≈ 3,5 MB |
| Botões, painéis, anel, pontos | PNG/9-patch pequenos | desprezível |

Regras: gerar no **tamanho em que a imagem será exibida na saída HD** (a UI do aparelho-alvo é
720p); nunca usar imagens maiores que a resolução da UI; usar JPEG para fundos e PNG com
transparência para cartões (cantos); evitar mais de ~3 fundos de tela cheia ao mesmo tempo.

## Regras para manter a consistência

1. Cores só em `Theme.brs`. O linter bloqueia cores em outros arquivos.
2. Fontes só via `Ui_setFont()`; tamanhos só via `Theme_typeScale()`.
3. Posições e tamanhos em múltiplos de 3 (o verificador avisa).
4. Uma região, um dono do foco. As pílulas não recebem foco do sistema.
5. Todo conteúdo fictício leva o rótulo "Conteúdo demonstrativo" (selo, kicker, nota nos detalhes
   e avisos).
6. Novas imagens: pelo gerador, nas dimensões da tabela acima (o verificador confere 256×144 e
   1280×720).
7. Mais de ~7 abas ou ~7 fileiras na Início exigem rever a densidade antes de acrescentar.

## Como trocar a identidade

| O quê | Onde |
|---|---|
| Nome exibido no app | `AppConfig().appName` em `source/shared/Theme.brs` |
| Nome na tela inicial do Roku | `title` no `manifest` |
| Cores | `Theme_get()` em `Theme.brs` **e** `THEMES` em `tools/generate_assets.py` (o verificador acusa divergência); depois `python3 tools/generate_assets.py` |
| Ícone, splash e marca | `brand_assets()` em `tools/generate_assets.py` |
| Novo tema | Id em `Theme_ids()` e em `Theme_get()`, e o tema em `THEMES` no gerador |
| Catálogo | `source/shared/DemoContent.brs` + uma imagem por id |

## Referências que influenciaram as decisões

Todas usadas como **orientação**, sem copiar layouts, marcas ou ativos. Detalhes de acesso em
[SOURCES.md](SOURCES.md).

| Decisão | Referência | Acesso |
|---|---|---|
| Fileiras em pilha vertical, itens na horizontal; foco uniforme; Voltar sem confirmação; sem botão Voltar virtual | Android Developers — Navigation on TV; Layouts (modelo "Browse") | **Lida diretamente** |
| Cartão 16:9 como padrão; bloco de texto na largura da imagem; gradiente sob texto sobre imagem | Android Developers — Cards | **Lida diretamente** |
| Foco por escala (1,05×) e contorno; um elemento focado por vez | Android Developers — Focus system | **Lida diretamente** |
| Tela cheia 1080p reduzida para 720p; margem de 5% | Android Developers — Layouts; Roku — Key Design Principles; `ui_resolutions` | Lida diretamente (Android) / resumo (Roku) |
| Tipografia grande, sem fontes decorativas | Android Developers — Typography; Roku — Key Design Principles | Lida diretamente / resumo |
| Composição geral: banner no topo, "Continue assistindo", recomendações, fileira de aplicativos | Matérias sobre a tela inicial do Google TV | **Resumo de busca** (não oficial) |
| Interface "invisível", poucos tipos de tela | Roku — UI philosophy | Resumo de busca |
| TCL / Google TV (tv.withgoogle.com, support.tcl.com) | — | **Não acessadas** (bloqueio de rede) |
| Imagens de referência do usuário | — | **Não recebidas** |
