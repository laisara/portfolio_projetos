# Fontes consultadas — Aurora TV

**Data de todas as consultas: 23/10/2026** (etapas 1 e 2 do projeto, no mesmo dia).

## Como ler o nível de acesso

| Código | Significado |
|---|---|
| **L** | **Lida diretamente**: o conteúdo original foi baixado e lido |
| **R** | **Resumo de busca**: texto produzido por uma ferramenta de busca sobre a página. Pode omitir ou resumir mal. **Não equivale a L** |
| **T** | **Só título/URL**: a página apareceu numa lista de resultados, sem conteúdo utilizável |
| **—** | **Não obtida** |

### Limitação de rede deste ambiente

`developer.roku.com`, `forum.developer.roku.com`, `sdkdocs-archive.roku.com`,
`community.roku.com`, `support.tcl.com` e `tv.withgoogle.com` responderam **`CONNECT 403`**
(proxy) ou **falha de DNS**. Por isso, **nenhuma página da documentação oficial da Roku foi
lida diretamente**, e **nenhuma página da TCL nem do Google TV (tv.withgoogle.com)** foi
acessada. O conteúdo oficial lido diretamente vem de:

- os **samples oficiais da Roku** (`gitlab.com/rokudev/samples`, licença MIT);
- as **guias de design de TV do Android Developers** (`developer.android.com`), que estavam
  acessíveis (L6 a L11 abaixo).

> **Imagens de referência do usuário:** o briefing menciona imagens de referência, mas
> **nenhuma imagem foi recebida neste ambiente**. As decisões de design se apoiam no texto
> do briefing, nas guias do Android TV (L6–L11) e em matérias sobre a interface do Google TV
> (R17). Quando as imagens estiverem disponíveis, convém comparar o resultado com elas.

## 1. Páginas pedidas no escopo

| URL | Acesso | O que se obteve |
|---|---|---|
| https://developer.roku.com/develop | — | Bloqueada; nenhum conteúdo |
| https://developer.roku.com/dev/docs/hello-world | T | Só título ("Building your first app"). O **sample oficial hello-world foi lido diretamente** (L2) |
| https://developer.roku.com/dev/docs/scenegraph | — | Não obtida. A arquitetura foi coberta por R9 e pelo guia oficial L3 |
| https://developer.roku.com/dev/docs/key-design-principles | R | Ver R16 |
| https://developer.roku.com/dev/docs/specifying-display-resolution | R | Ver R2 |
| https://developer.roku.com/dev/docs/development-setup | R | Ver R13 |
| https://developer.roku.com/dev/docs/developer-setup | R | Ver R4 |

## 2. Fontes oficiais Roku lidas diretamente (L)

| ID | Fonte | O que sustenta |
|---|---|---|
| L1 | `github.com/rokudev/samples` (README, via raw.githubusercontent.com) e `gitlab.com/rokudev/samples` (licença MIT, "Copyright 2020 Roku, Inc.") | O repositório de samples da Roku mudou para o GitLab. Sequência do modo de desenvolvedor; login `rokudev`; instalação de .zip pelo instalador web |
| L2 | `gitlab.com/rokudev/samples` → `getting started/hello-world-master/source/` (`manifest`, `source/Main.brs`, `components/helloworld.xml`) | Formato do manifest (`title`, `major_version`, `minor_version`, `build_version`, `mm_icon_focus_*`, `splash_screen_*`, `splash_color`, `splash_min_time`); tamanhos de ícone (FHD 540×405, HD 290×218) e splash (1920×1080, 1280×720); padrão `roSGScreen` + `roMessagePort` + `CreateScene` + laço `wait` com `isScreenClosed`; componente `extends="Scene"` com `<script>` e `<children>`; `m.top.setFocus(true)` |
| L3 | `gitlab.com/rokudev/samples` → `getting started/SDK-Development-Guide-master/` (`project-setup.md`, `scenegraph-ui.md`) | Pastas obrigatórias `source/`, `components/`, `images/` e o `manifest`; todos os `.xml` de `components/` são carregados como tipos de nó; `images/` deve ter o ícone HD e o splash FHD; **`ui_resolutions=fhd` informa ao firmware que a UI foi feita para FHD e deve ser escalada para SD e HD**; exemplo de `RowList` (`itemSize` inclui o rótulo, `rowItemSize`, `rowFocusAnimationStyle`) |
| L4 | `gitlab.com/rokudev/samples` → `ux components/lists and grids/AdvancedRowList/components/MoreInfoOnFocusGridItem/` | Campos de interface de um item de RowList (`itemContent`, `width`, `height`, `focusPercent`, `rowFocusPercent`, `rowHasFocus`, `rowListHasFocus`); padrão de realce `visible = rowListHasFocus and focusPercent > 0` |
| L5 | `gitlab.com/rokudev/samples` → `ux components/text/` | Uso de fontes predefinidas no XML (`font="font:SmallBoldSystemFont"`, `font:MediumBoldSystemFont`) |

### Referências de design lidas diretamente (Android Developers)

O Google TV usa o Android TV como base; estas páginas descrevem os princípios de interface
de TV desse ecossistema. **Foram usadas como orientação, não copiadas.**

| ID | Fonte (lida diretamente) | O que sustenta | Como foi usado |
|---|---|---|---|
| L6 | [Navigation on TV](https://developer.android.com/training/tv/get-started/navigation) | D-pad leva o foco ao objeto mais próximo na direção; garantir que todo controle visível seja alcançável; sempre haver um item em foco; **esquema de foco uniforme**; Voltar leva ao destino anterior e **ideal é que Voltar saia do app**; sem tela de confirmação para sair; **sem botão Voltar virtual**; "categorias no eixo vertical, itens de cada categoria no horizontal"; evitar hierarquias aninhadas | Estrutura de fileiras (vertical = fileiras, horizontal = itens); foco sempre visível; Voltar sem confirmação. **Divergência consciente:** a guia recomenda "navegação em laço" (o último controle volta ao primeiro). O Aurora **não** faz laço: as pontas consomem a tecla, pois a Roku e o briefing pedem comportamento previsível nos limites |
| L7 | [Design for TV](https://developer.android.com/design/ui/tv/guides/foundations/design-for-tv) | Distância típica de ~3 m (10 pés): texto e elementos grandes; layouts simples; feedback instantâneo e distinto ao navegar | Tipografia e escala dos cartões |
| L8 | [Layouts](https://developer.android.com/design/ui/tv/guides/styles/layouts) | Projetar em 960×540 dp com ativos para 1080p que o sistema reduz para 720p; **margem de ~5%** (valores divergentes na própria página: 48/27 dp, 58/28 dp; marcada "verificar no kit Figma"); grade de 12 colunas; modelo **Browse**: fileiras em pilha vertical, navegação vertical entre fileiras e horizontal dentro de cada uma; **"evitar excesso de painéis"**; "mais modernos TVs não têm mais overscan" | Layout FHD com margem de 96 px (5%); escala de 1080p→720p; fileiras em pilha |
| L9 | [Focus system](https://developer.android.com/design/ui/tv/guides/styles/focus-system) | Foco por **escala (padrões 1,025, 1,05 e 1,1×)**, brilho, contorno, borda ou mudança de cor; **só um elemento focado por vez**; sem valores de contraste ou duração | Escala de 1,05× + anel na cor de destaque nos cartões; pílula preenchida nos botões |
| L10 | [Cards](https://developer.android.com/design/ui/tv/guides/components/cards) | Proporções **16:9** (mais comum), **1:1** e **2:3**; bloco de conteúdo com a largura da imagem; cartões compactos com texto sobre imagem exigem **gradiente semitransparente** | Cartões 16:9 de 384×216; título e metadados abaixo, na largura da imagem; gradiente embutido nas imagens de banner |
| L11 | [Typography](https://developer.android.com/design/ui/tv/guides/styles/typography) | Tipografia grande, com contadores abertos e traços não finos; evitar fontes decorativas; escala com Display, Headline, Title, Body e Label; Display "não para títulos de seção" | Escala tipográfica do Aurora (display/title/heading/body/label/caption) e uso da fonte do sistema |

Páginas **tentadas e não obtidas**: a guia do carrossel do Android TV (`.../components/carousel`,
HTTP 404), `support.tcl.com` e `tv.withgoogle.com` (bloqueio de rede).

## 3. Documentação oficial Roku por resumo de busca (R)

| ID | Página | O que o resumo sustenta |
|---|---|---|
| R1 | [Hardware specifications](https://developer.roku.com/dev/docs/hardware) | **Roku Express 3960X**: modelo de 2022, codinome *Rockett*, **512 MB de RAM**, CPU ARM Cortex A55, OpenGL ES 2.0, **UI máxima de 720p**, reproduz até 1080p, sem HDR. Os 3900X/3910X/3930X também têm 512 MB e UI de 720p |
| R2 | [Specifying display resolution](https://developer.roku.com/dev/docs/specifying-display-resolution) | `ui_resolutions` aceita `sd`, `hd` e `fhd` (padrão `sd,hd`); o SceneGraph escala automaticamente; em FHD, posicionar em limites de 3 px (2 px em HD); `uri_resolution_autosub`; campo `currentDesignResolution` da Scene (OS 7.7+) |
| R3 | [Manifest file](https://developer.roku.com/docs/developer-program/getting-started/architecture/channel-manifest.md) | Mínimo obrigatório: `title`, `major_version`, `minor_version`, `build_version`; atributos diferenciam maiúsculas; cada par termina em nova linha |
| R4 | [Activating developer mode](https://developer.roku.com/dev/docs/developer-setup) | Sequência Home×3, Cima×2, Direita, Esquerda, Direita, Esquerda, Direita; senha definida pelo usuário; reinicialização ao ativar; **só um app instalado por sideload por vez, e um novo sideload substitui o anterior**; reinstalar versão idêntica gera erro; o app aparece na última fileira da tela inicial; no Cloud Emulator o modo dev é ativado pela interface web |
| R5 | [onKeyEvent()](https://developer.roku.com/dev/docs/onkeyevent), [Scene](https://developer.roku.com/dev/docs/scene), [Remote control events](https://developer.roku.com/docs/developer-program/core-concepts/scenegraph-xml/remote-control-events.md) | Retornar `true` encerra a propagação; `false` sobe pela cadeia de foco; `backExitsScene` (padrão `true`) só funciona com o foco definido explicitamente via `setFocus(true)`; **Home é tratado pelo firmware**; desde o OS 12.0, o Voltar de saída gera uma interrupção (Instant Resume) |
| R6 | [RowList](https://developer.roku.com/docs/references/scenegraph/list-and-grid-nodes/rowlist.md), [Lists and grids](https://developer.roku.com/dev/docs/list-and-grid-nodes) | `itemComponentName`; estilos `floatingFocus`, `fixedFocusWrap` e `fixedFocus`; `focusPercent` (0–1) e `rowFocusPercent`; `rowListHasFocus` |
| R7 | [Poster](https://developer.roku.com/docs/references/scenegraph/renderable-nodes/poster.md), [Memory management](https://developer.roku.com/dev/docs/memory-management) | Texturas ocupam **4 bytes por pixel** (1920×1080 ≈ 8,3 MB); usar imagens no tamanho de exibição ou `loadWidth`/`loadHeight`; imagens maiores que a UI exigem modo de escala; `bitmapMargins` para 9-patch (OS 7.5+); suporte a JPEG, PNG e WebP; diagnóstico com `r2d2_bitmaps` (porta 8080) |
| R8 | [roRegistry](https://developer.roku.com/docs/references/brightscript/components/roregistry.md), [ifRegistrySection](https://developer.roku.com/dev/docs/ifregistrysection) | Escritas só persistem com `Flush()`; Flush transacional; chamar raramente (registro criptografado e Flush lento) |
| R9 | [Threads](https://developer.roku.com/docs/developer-program/core-concepts/threads.md), [Data management](https://developer.roku.com/dev/docs/data-management), [Developing SceneGraph applications](https://developer.roku.com/dev/docs/developing-scenegraph-applications) | Thread principal cria a cena; a thread de renderização desenha tudo e tem orçamento de **16 ms por quadro** a 60 fps; Task para dados de servidor e arquivo; acesso entre threads gera *rendezvous*; cada XML define um tipo de nó |
| R10 | [ifDeviceInfo](https://developer.roku.com/dev/docs/ifdeviceinfo), [ifAppInfo](https://developer.roku.com/docs/references/brightscript/interfaces/ifappinfo.md) | `GetModel()`, `GetOSVersion()` (major, minor, revision, build), `GetUIResolution()` (name, width, height), `GetDisplayMode()`, `ifAppInfo.GetVersion()` |
| R11 | [ifSGNodeField](https://developer.roku.com/dev/docs/ifsgnodefield), [SceneGraph data scoping](https://developer.roku.com/dev/docs/data-scoping) | `unobserveFieldScoped()` remove só o observador do componente chamador; `unobserveField()` remove todos; `observeFieldScopedEx()` desde o OS 12.0 |
| R12 | [Font](https://developer.roku.com/dev/docs/font), [SimpleLabel](https://developer.roku.com/docs/references/scenegraph/renderable-nodes/simplelabel.md) | Nó Font com `uri` e `size`; fontes de sistema como `font:MediumBoldSystemFont`; `font:SystemFontFile` aparece **documentada para SimpleLabel** (não confirmada para Font/Label) |
| R13 | [Development setup](https://developer.roku.com/dev/docs/development-setup), [Roku Cloud Emulator](https://developer.roku.com/dev/docs/rce), [Eclipse IDE support](https://developer.roku.com/dev/docs/ide-support) | O plug-in Eclipse foi descontinuado; a Roku aponta extensões da comunidade (BrightScript para VS Code); o **Roku Cloud Emulator** roda versões atuais do Roku OS na nuvem, exige conta de desenvolvedor e tem teste gratuito limitado (**não utilizado**) |
| R14 | [Release notes](https://developer.roku.com/dev/docs/release-notes) | O Roku OS 14.5 encerrou o suporte ao RSG 1.1 e os apps devem declarar `rsg_version=1.2`; certificação exige splash FHD e HD |
| R15 | [Specifications and Feature Support / Streaming Store graphics](https://developer.roku.com/docs/specs/graphics.md) | Zona segura de título: 80% da resolução (FHD: deslocamento 192, 106; área 1534×866); zona segura de ação: 90%. Página antiga |
| R16 | [Key Design Principles](https://developer.roku.com/dev/docs/key-design-principles), [UI philosophy](https://developer.roku.com/docs/developer-program/design/general-tv-ui-philosophy.md) | Margem de pelo menos **5%** por causa do overscan; visualização a cerca de 3 m; alto contraste e texto grande; baixa densidade de informação; testar em TV real |
| R17 | Matérias sobre a tela inicial do Google TV: [Android Authority](https://androidauthority.com/google-tv-for-you-home-screen-refresh-3420714), [9to5Google](https://9to5google.com/2024/02/28/google-tv-your-apps-redesign/), [Cord Cutters News](https://cordcuttersnews.com/google-tv-is-getting-an-updated-home-screen-with-a-new-look-new-features/), [How-To Geek](https://www.howtogeek.com/694783/how-to-customize-the-google-tv-home-screen/) (**resumo de busca**; não são fontes oficiais) | Tela "Para você" com **carrossel de destaque no topo** e fileiras de recomendação; **fileira de aplicativos** em ícones menores; **fileira "Continue assistindo"**. Nada específico da TCL foi encontrado **Uso:** Composição geral: banner → fileiras → aplicativos. Nenhum layout foi copiado  |
| R18 | [Roku — Design](https://developer.roku.com/develop/design/design-index) e [UI philosophy](https://developer.roku.com/docs/developer-program/design/general-tv-ui-philosophy.md) (resumo de busca) | Práticas **obrigatórias para certificação** e **recomendadas**; interface de TV deve ser "invisível"; **usar poucos tipos de tela/modelos**; testar em TV real a ~3 m em sala moderadamente escura **Uso:** Poucos componentes reutilizáveis (um `CatalogScreen` para 4 abas)  |

## 4. Comunidade e terceiros

| ID | Fonte | Acesso | O que sustenta | Confiabilidade |
|---|---|---|---|---|
| C1 | Fórum Roku: "RowList leaves focusPercent short of 0..." | R | Relato de usuário (Roku Ultra, **OS 16.0.4**) de que `focusPercent` não chega a 0 em `fixedFocus`/`fixedFocusWrap` (não em `floatingFocus`) | Média: relato recente, não confirmado pela Roku. O app usa `floatingFocus` |
| C2 | Fórum Roku: "How to modify System Fonts in SceneGraph?" | R | Atribuir uma fonte de sistema (string) a `label.font` cria um nó Font; o tamanho pode ser ajustado em `label.font.size` | Média: posts antigos |
| C3 | [brs-engine](https://github.com/lvcabral/brs-engine) — `docs/limitations.md`, `docs/integrating.md` (raw.githubusercontent.com) | L | Simulador BrightScript (MIT); extensão SceneGraph em beta; "espere diferenças de renderização"; animação nativa de foco de listas não implementada; uma única thread (sem separação principal/render); registro guardado no localStorage; exige COOP/COEP | Ferramenta de terceiros |
| C4 | Pacotes npm: `brighterscript` 0.73.8, `@rokucommunity/bslint` 0.8.47, `brs-engine` 2.6.1, `brs-scenegraph` 0.6.1, `brs-node` 2.6.1 (README e metadados) | L | Ferramentas de validação, lint e simulação (RokuCommunity e terceiros), licença MIT | Ferramentas de terceiros |

## 5. Afirmações sem fonte que as sustente

| Afirmação | Situação |
|---|---|
| Roku OS **15.3** no aparelho do usuário | **Informado pelo usuário**, não verificado. O app mostra a versão real em Configurações → Diagnóstico |
| Comportamento exato do 9-patch (cantos) no 3960X | Desconhecido. O simulador desenha cantos menores que os da imagem |
| `font:BoldSystemFontFile` em nó Font | **Não funcionou no simulador**; descartado |
| Limite de tamanho de pacote para sideload | Não encontrado na documentação obtida |

## 6. Origem dos recursos visuais

| Recurso | Origem | Direitos |
|---|---|---|
| Pôsteres e fundos dos 20 títulos | Gerados por `tools/generate_assets.py` (gradientes, formas e silhuetas **originais**, sem fotos nem personagens) | Criação deste projeto |
| Ícones dos 8 aplicativos | Gerados pelo mesmo script (glifos geométricos simples: reprodução, nota, foto, jornal, nuvem, controle, chapéu de chef, halteres). **Não reproduzem logotipos nem marcas de nenhum produto real** | Criação deste projeto |
| Nomes de títulos e aplicativos | Inventados. Qualquer semelhança com produtos reais é coincidência (nomes comuns como "Galeria", "Tempo", "Receitas") | Criação deste projeto |
| Logotipo "Aurora TV" (arco em 3 cores), ícone do canal e splash | Gerados pelo mesmo script. O texto "Aurora TV" é rasterizado com a fonte **Inter** (licença SIL OFL 1.1), apenas na imagem; a fonte **não** é incluída no pacote | Criação deste projeto; fonte Inter sob OFL |
| Fonte exibida no app | Fonte do sistema Roku (nada embarcado) | — |
| Botões, painéis, anel de foco e pontos do indicador (PNG/9-patch) | Gerados pelo mesmo script | Criação deste projeto |

**Pendências de recursos:** nenhuma imagem é fotográfica. Para uma versão com catálogo real, as
imagens de cada id (`images/posters/<id>.png` 256×144 e `images/backgrounds/<id>.jpg` 1280×720)
precisam ser **substituídas por ativos licenciados** pelo detentor dos direitos.
