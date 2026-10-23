# Compatibilidade de plataforma — Aurora TV

Última atualização: 23/10/2026. **Nenhum teste foi feito no Roku físico.**

Referências [L#], [R#] e [C#]: ver [SOURCES.md](SOURCES.md). O nível de acesso de cada
fonte (leitura direta × resumo de busca) está registrado lá.

## Legenda

| Estado | Significado |
|---|---|
| **Documentado (L)** | Sustentado por sample ou guia oficial da Roku **lido diretamente** |
| **Documentado (R)** | Sustentado por documentação oficial obtida **por resumo de busca** |
| **Simulado** | Funcionou no simulador brs-engine (de terceiros, **não é o Roku OS**) |
| **Pendente no hardware** | Só um teste no aparelho confirma |
| **Desconhecido** | Sem evidência |

## Aparelho-alvo

| Item | Valor | Evidência |
|---|---|---|
| Modelo informado | Roku Express **3960BR** | Usuário |
| Modelo na tabela da Roku | Roku Express **3960X**, 2022, codinome *Rockett* | Documentado (R1) |
| 3960BR = variante brasileira do 3960X | Provável pela numeração | **Desconhecido** (não há fonte que associe o sufixo BR) |
| RAM | 512 MB | Documentado (R1), para o 3960X |
| CPU / GPU | ARM Cortex A55 / OpenGL ES 2.0 | Documentado (R1) |
| **Resolução máxima da UI** | **720p (HD)** | Documentado (R1). Por isso a arte de conteúdo é gerada no tamanho HD |
| Reprodução de vídeo | Até 1080p, sem HDR | Documentado (R1). O app não reproduz vídeo |
| Roku OS | **15.3**, informado pelo usuário | **Não verificado.** O app mostra a versão real em Configurações → Diagnóstico |

## Decisões tomadas por causa do aparelho

| Decisão | Motivo |
|---|---|
| `ui_resolutions=fhd` com layout em 1920×1080 e valores múltiplos de 3 | O firmware escala o FHD para HD (L3, R2); com valores múltiplos de 3, a escala de 2/3 fica sem frações (R2) |
| Imagens de conteúdo no tamanho da saída HD (cartões 288×162, fundos 1280×720) | Texturas custam 4 B/pixel (R7). Com a UI de 720p (R1), imagens FHD gastariam 2,25× mais memória sem ganho visível |
| Sem `uri_resolution_autosub` | Um único conjunto de imagens HD atende o alvo. O formato exato do atributo não foi confirmado nas fontes obtidas |
| Só a tela Início fica em memória; as outras abas são recriadas a cada visita | Reduz as texturas carregadas ao mesmo tempo em 512 MB |
| Imagem de destaque com escurecimento embutido | Uma textura de tela cheia a menos |
| Sem rede, sem Task nodes | Nada a buscar: os dados são locais (R9 recomenda Task só para dados remotos ou de arquivo) |

## Recursos usados pelo app

| Recurso | Uso no Aurora | Estado |
|---|---|---|
| `roSGScreen`, `CreateScene`, `roMessagePort`, `isScreenClosed` | `source/main.brs` | Documentado (L2) · Simulado |
| Componentes XML (`<component>`, `<interface>`, `<script uri>`, `<children>`) | Todos os componentes | Documentado (L2, L3) · Simulado |
| `Scene`, `Group`, `Poster`, `Label`, `Rectangle`, `Timer` | Toda a UI | Documentado (L2–L5, R7) · Simulado |
| `RowList` + componente de item (`itemComponentName`) | Fileiras de cartões | Documentado (L3, L4, R6) · Simulado |
| Campos de item `focusPercent` e `rowListHasFocus` | Anel de foco dos cartões | Documentado (L4, R6) · Simulado |
| `rowItemFocused`, `rowItemSelected`, `jumpToRowItem` (RowList) | Seleção e posicionamento | `rowItemFocused`/`rowItemSelected` documentados (L3); `jumpToRowItem` **Simulado**, ainda não visto nas fontes obtidas |
| `onKeyEvent`, `setFocus`, `isInFocusChain`, `focusedChild` | Navegação | Documentado (R5) · Simulado |
| Voltar no último nível encerra o app (`backExitsScene`) | Saída do app | Documentado (R5) · Simulado (`EXIT_USER_NAV`) |
| `Animation` + `Vector2DFieldInterpolator` / `FloatFieldInterpolator` | Recolher o destaque | Simulado · nomes **não confirmados nas fontes obtidas** (usados por convenção da plataforma) |
| `callFunc` com funções declaradas em `<interface>` | API entre telas | Simulado · pendente no hardware |
| `m.global` + `addFields` + `observeField` na thread principal | Estado compartilhado e persistência | Simulado · pendente no hardware |
| `observeFieldScoped` / `unobserveFieldScoped` | Liberar observadores ao destruir telas | Documentado (R11) · Simulado |
| `roRegistrySection` (`Read`, `Write`, `Exists`, `Flush`) na thread principal | Favoritos e tema | Documentado (R8) · Simulado (persistiu ao relançar) |
| `FormatJson` / `ParseJson` | Serialização do estado | Simulado (brs-cli e brs-engine) |
| `roDeviceInfo` (`GetModel`, `GetOSVersion`, `GetUIResolution`) e `roAppInfo.GetVersion` | Diagnóstico | Documentado (R10) · Simulado |
| `Scene.currentDesignResolution` | Diagnóstico | Documentado (R2) · Simulado |
| Fonte via `label.font = "font:MediumBoldSystemFont"` + `label.font.size` | Toda a tipografia | Fonte predefinida: Documentado (L5). Ajuste de tamanho: relato da comunidade (C2) · Simulado · **pendente no hardware** |
| Imagens 9-patch (`*.9.png`) | Pílulas, painéis, anel de foco | Documentado (R7: `bitmapMargins`) · Simulado, com **cantos diferentes do esperado** · pendente no hardware |
| PNG com transparência (cantos dos cartões) e JPEG | Arte | Documentado (R7) · Simulado |

## Compatibilidade não confirmada (pendente no hardware)

| Item | Risco | Como verificar |
|---|---|---|
| Aparência dos 9-patch (raio dos cantos) | Pílulas podem aparecer com cantos diferentes dos do simulador | Inspeção visual no aparelho |
| Tamanho real das fontes do sistema com `font.size` | Textos maiores ou menores que o previsto | Inspeção visual; ajustar só em `Ui_setFont()` |
| Desempenho do RowList com arte de 288×162 e ampliação no foco | Travamentos ao rolar | Navegar segurando as setas; `r2d2_bitmaps` |
| Memória de textura | Imagens podem falhar ao carregar | `r2d2_bitmaps` (R7); o placeholder já cobre falhas |
| Animação de recolher o destaque (0,3 s) | Pode engasgar no Cortex A55 | Inspeção visual; pode ser desligada sem perda de layout |
| Instant Resume / interrupção ao sair (OS 12+, R5) | Retomada inesperada | Sair e reabrir pela tela inicial |
| Roku OS 15.3 informado | Diferenças de versão | Conferir em Configurações → Diagnóstico |

## Limitações do simulador usado (brs-engine + brs-scenegraph)

- **Não é o Roku OS.** É um simulador de terceiros (C3) e não comprova o comportamento no
  aparelho.
- Roda o código principal e a cena numa **única thread**, enquanto o Roku separa a thread
  principal da de renderização (C3). Restrições de thread do aparelho não são exercitadas.
- A extensão SceneGraph está em **beta** e "espere diferenças de renderização" (C3).
- A animação nativa de foco de listas não está implementada no simulador (C3).
- As fontes do sistema são substitutas: o simulador usa *Metropolis*; o Roku usa a fonte
  própria do aparelho.
- Os dados de Diagnóstico nas capturas (modelo **3960X**, **Roku OS 16.0.4**,
  interface **HD 1280×720**) vêm da **configuração do simulador**, não do aparelho do
  usuário.
- O registro do Roku é simulado no `localStorage` do navegador.
- Durante o desenvolvimento houve falhas **do harness**, não do app:
  - corrida entre o download dos arquivos de sistema do simulador e o início do app,
    corrigida entregando `common.zip` já baixado em `DeviceInfo.assets`;
  - falha ao reidratar o armazenamento num contexto novo do navegador, contornada
    relançando o app na mesma instância do simulador, como o aparelho faz ao reabrir um
    canal.

  Ver TEST_PLAN.md.

## Ferramentas avaliadas e não usadas

| Ferramenta | Motivo |
|---|---|
| Roku Cloud Emulator (R13) | Exige conta de desenvolvedor Roku (credenciais pessoais), o que está fora do escopo desta etapa |
| Plug-in Eclipse da Roku | Descontinuado (R13) |
| Sideload no aparelho | Proibido nesta etapa |
