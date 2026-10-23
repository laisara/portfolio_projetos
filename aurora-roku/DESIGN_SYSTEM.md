# Sistema de design — Aurora TV

Interface de "dez pés" para TV: leitura a cerca de 3 m, navegação só por controle remoto.
A identidade é configurável. Nome, cores e imagens de interface ficam centralizados e
são trocados em poucos lugares (ver [Como trocar a identidade](#como-trocar-a-identidade)).

## Princípios

1. **Pouca informação por tela.** Margens generosas e espaço vazio. A Roku recomenda
   baixa densidade de informação e texto grande ([SOURCES.md](SOURCES.md), R16).
2. **Foco inconfundível.** O item focado sempre muda de forma e de cor: anel na cor de
   destaque e leve ampliação nos cartões, ou fundo preenchido nas pílulas.
3. **Bonito sem animação.** As animações só interpolam até posições finais definidas. Se
   forem desligadas, as telas chegam ao mesmo estado.
4. **Leve para o hardware.** Poucas texturas grandes ao mesmo tempo, imagens no tamanho
   da saída HD e nenhum laço contínuo de atualização.
5. **Original.** A arte é procedural, sem marcas, logotipos ou telas de terceiros.

## Grade e resolução

- O layout é desenhado em **1920×1080** (`ui_resolutions=fhd`) e o sistema escala para a
  saída do aparelho. O Roku Express 3960X tem interface de no máximo **720p**, então a
  escala ali é de 2/3.
- **Toda posição e todo tamanho são múltiplos de 3.** A Roku recomenda limites de 3 px no
  FHD; com eles, a escala para HD fica sem frações. O `tools/check-project.js` verifica.
- **Margem segura:** 96 px na horizontal (5%) e o conteúdo começa abaixo de y=120 no
  topo. A Roku recomenda pelo menos 5% de margem por causa do *overscan*. A antiga zona de
  título de 80% é registrada em SOURCES.md, mas o layout a respeita só para textos longos
  (sinopses começam em x=96 e terminam antes de x=1056).

| Região | Posição (FHD) |
|---|---|
| Barra superior (marca + abas) | y 39–120 |
| Conteúdo | x 96 até a borda direita (as fileiras "sangram" para indicar continuação) |
| Avisos (Toast) | centralizado, y 924 |

## Paleta

Definida em `source/shared/Theme.brs` (formato SceneGraph `0xRRGGBBAA`). O linter
(`bslint`, regra `color-format: never`) **proíbe cores fora desse arquivo**.

| Papel | Aurora Noturna (padrão) | Aurora Boreal (variação) | Uso |
|---|---|---|---|
| `background` | `#080B14` | `#06110F` | Fundo principal, base dos detalhes |
| `surface` | `#151B2A` | `#12201E` | Painéis, placeholder de imagem |
| `surfaceRaised` | `#1E2638` | `#1A2C29` | Pílulas sem foco, trilho de progresso |
| `textPrimary` | `#F5F7FC` | `#F3FAF8` | Títulos e texto principal |
| `textSecondary` | `#A6AEC0` | `#9DB5AF` | Metadados, legendas, abas inativas |
| `accent` | `#79A9FF` | `#5FD9C0` | Foco, rótulos "kicker", progresso |
| `onAccent` | `#080B14` | `#04110E` | Texto sobre a cor de destaque |

Gradientes: há só **um** por tela, o fundo, com brilho discreto no canto superior. As
imagens de destaque trazem o escurecimento ("scrim") já aplicado na própria imagem à
esquerda e na base. Isso garante contraste do texto sem uma camada extra de textura.

## Tipografia

Fonte do sistema Roku (sem fontes embarcadas). Tamanhos no design FHD, definidos em
`Theme_typeScale()`:

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `display` | 84 | Negrito | Título do destaque e dos detalhes |
| `title` | 60 | Negrito | Título do painel das prateleiras, cabeçalho das Configurações |
| `heading` | 36 | Negrito | Rótulo das fileiras, seções do diagnóstico |
| `body` | 30 | Regular | Sinopses, avisos |
| `label` | 27 | Regular/Negrito | Metadados, texto das abas e dos cartões |
| `caption` | 24 | Regular | Legendas e notas (mínimo: 16 px na saída HD) |

Na saída 720p do aparelho-alvo, cada tamanho vale 2/3 do valor acima: o menor texto
fica com 16 px e os títulos com 56 px.

**Implementação:** `Ui_setFont()` em `components/shared/Ui.brs` é o único ponto que
define fontes. Atribui `font:MediumBoldSystemFont` ou `font:MediumSystemFont`, o mesmo
padrão dos samples oficiais, e ajusta o tamanho no nó Font da Label.

## Espaçamentos

| Token | Valor (FHD) | Uso |
|---|---|---|
| Entre cartões | 30 | `rowItemSpacing` |
| Entre fileiras | 30 | `itemSpacing` |
| Entre botões | 18 | Destaque e detalhes |
| Entre abas | 9 | Barra superior |
| Rótulo da fileira → cartões | 15 | `rowLabelOffset` |
| Imagem → título do cartão | 21 | |

## Cantos e cartões

- **Cartão de conteúdo** (`ContentCard`): imagem 16:9 de **432×243**, cantos de 18 px (12 px
  na saída HD), título em negrito e linha de metadados. Os cantos arredondados estão na
  própria imagem (PNG com transparência), porque o SceneGraph não arredonda retângulos.
- **Pílulas** (`PillButton`): altura 72 (botões) ou 60 (abas), com imagens 9-patch por
  tema (`images/ui/<tema>/pill_*.9.png`).
- **Painéis:** 9-patch com cantos de 12 px na saída HD.
- **Placeholder:** se a imagem não carregar, aparece um retângulo na cor `surface` e o
  título continua visível.

## Estados de foco

| Elemento | Sem foco | Com foco |
|---|---|---|
| Cartão | Imagem + texto | **Anel de 3 px na cor de destaque** + ampliação de 5% (escala pelo centro da imagem) |
| Botão / opção | Pílula `surfaceRaised`, texto `textPrimary` | Pílula **preenchida na cor de destaque**, texto `onAccent` |
| Aba ativa (barra sem foco) | Pílula `surfaceRaised`, texto `textPrimary` | — |
| Aba realçada (barra com foco) | — | Pílula na cor de destaque |
| Abas inativas | Texto `textSecondary`, sem fundo | — |

O anel dos cartões só aparece quando o próprio RowList tem o foco (`rowListHasFocus`),
como no sample oficial. Assim, um cartão nunca parece focado enquanto o foco está em
outra região.

## Transições

| Transição | Duração | Curva | O que muda |
|---|---|---|---|
| Destaque → fileiras (Início) | 0,3 s | `outCubic` | Conteúdo sobe 531 px, o destaque esmaece, o fundo escurece 60% |
| Foco entre cartões | Controlado pelo RowList | — | Anel e escala acompanham `focusPercent` |
| Aviso (Toast) | Aparece na hora e some após 3 s | — | Visibilidade |

Nenhuma animação roda em laço. O único temporizador é o disparo único do Toast.

## Componentes visuais

| Componente | Arquivo | Papel |
|---|---|---|
| Barra de navegação | `NavigationBar` | Marca, selo "Versão demonstrativa" e 6 abas |
| Destaque | `HeroSection` (dentro de `HomeScreen`) | Kicker, título, metadados, sinopse e 2 ações |
| Fileira de cartões | `RowList` nativo + `ContentCard` | Navegação horizontal e vertical gerenciada pelo sistema |
| Cartão | `ContentCard` | Imagem, título, metadados e barra de progresso opcional |
| Pílula | `PillButton` | Abas, ações e opções |
| Painel de prateleiras | `CatalogScreen` | Filmes, Séries, Biblioteca e Favoritos (painel do item focado + fileiras) |
| Detalhes | `DetailsScreen` | Camada em tela cheia sobre a aba |
| Configurações | `SettingsScreen` | Opções + painel Sobre/Diagnóstico |
| Aviso | `Toast` | Mensagens curtas, como "Conteúdo demonstrativo..." |

## Regras de consistência

1. Cores só em `Theme.brs`. O linter bloqueia cores em outros arquivos.
2. Fontes só via `Ui_setFont()` e tamanhos só via `Theme_typeScale()`.
3. Posições e tamanhos em múltiplos de 3. O verificador avisa quando não estão.
4. Uma região, um dono do foco. As pílulas não recebem foco do sistema: o componente pai
   realça a pílula ativa e trata as teclas.
5. Todo conteúdo fictício leva o rótulo "Conteúdo demonstrativo" (kicker, nota nos
   detalhes e selo na barra).
6. Imagens novas no tamanho em que serão exibidas na saída HD (ex.: cartões em 288×162),
   geradas por `tools/generate_assets.py`.

## Como trocar a identidade

| O quê | Onde |
|---|---|
| Nome exibido no app | `AppConfig().appName` em `source/shared/Theme.brs` |
| Nome na tela inicial do Roku | `title` no `manifest` |
| Cores | `Theme_get()` em `Theme.brs` **e** `THEMES` em `tools/generate_assets.py` (o verificador acusa divergência), depois rode `python3 tools/generate_assets.py` |
| Ícone e splash | `brand_assets()` em `tools/generate_assets.py` |
| Novo tema | Inclua o id em `Theme_ids()` e em `Theme_get()`, e o tema em `THEMES` no gerador |
