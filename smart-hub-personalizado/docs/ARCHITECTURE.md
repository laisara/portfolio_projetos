# Arquitetura

## Decisão

**HTML + CSS + JavaScript ES5 puro, sem framework, carregado por `<script>` em ordem, com uma
camada de adaptador de plataforma.**

Justificativa:

- A geração 2014 (série H) usa a plataforma legada da Samsung, baseada em aplicações web
  (ver [FEASIBILITY.md](FEASIBILITY.md#4-tecnologias-potencialmente-compatíveis)). O nível
  exato de JavaScript **não foi confirmado**: as fontes citam tanto "JavaScript 1.6 / Maple"
  quanto "WebKit". Por isso o protótipo usa ES5 sem APIs modernas, a opção mais
  conservadora, e verifica isso automaticamente (`npm run check:legacy`).
- Frameworks (React, Vue etc.) e transpiladores foram descartados. Eles exigem *polyfills*,
  aumentam o tamanho e o uso de memória num hardware de entrada de 2014 e não trazem
  benefício para cerca de 10 telas.
- ES modules, `fetch` e `Promise` foram evitados porque não há garantia de que existam
  na TV.

Alternativas avaliadas:

| Alternativa | Motivo da rejeição (por ora) |
|---|---|
| Cordova + TOAST (`cordova-sectv-orsay`) | É oficial, mas adiciona camadas e dependências antes mesmo de confirmar que o app de usuário roda. Pode ser reavaliada para o empacotamento |
| SPA moderna com transpilação (Babel) para ES5 | Tamanho e complexidade maiores. A depuração no aparelho fica difícil |
| App Tizen (.wgt) | Plataforma incompatível com TVs 2014 |

## Visão geral

```
                ┌────────────────────── prototype/index.html ──────────────────────┐
 teclado/      │                                                                    │
 controle ──▶  │  Adaptador de plataforma ──▶ keys.js ──▶ app.js (laço principal)   │
               │  (browser-adapter.js =        (ações:      │                       │
               │   SIMULAÇÃO)                   UP/DOWN/…)  ├─▶ router.js (pilha)   │
               │      │                                     ├─▶ focus.js (foco)     │
               │      ├─ storageBackend ──▶ storage.js ──▶ preferences.js          │
               │      ├─ isOnline / eventos                 ├─▶ screens/*.js        │
               │      └─ getSystemInfo / exit               │     (descritores)     │
               │                                            └─▶ ui/render.js (DOM)  │
               │  data/catalog.js, data/library-provider.js (DADOS SIMULADOS)       │
               └────────────────────────────────────────────────────────────────────┘
```

## Módulos e responsabilidades

| Arquivo | Responsabilidade | Depende de DOM? |
|---|---|---|
| `core/namespace.js` | Namespace `window.SmartHub` e utilitários (clamp, extend, indexOf) | Não |
| `core/logger.js` | Registro de diagnóstico em memória (buffer circular de 50 itens). Não usa a rede | Não |
| `core/storage.js` | Chave/valor em JSON sobre o backend do adaptador, com fallback para memória se o backend falhar | Não |
| `core/preferences.js` | Preferências validadas por esquema (cor, texto, animações, favoritos, simulação) | Não |
| `core/keys.js` | Converte `keyCode` em ação lógica e controla a repetição ao segurar uma tecla | Não |
| `core/focus.js` | Modelo de foco em linhas: limites, linhas vazias, memória de coluna e âncoras | Não |
| `core/router.js` | Pilha de telas (abas na base, detalhes empilhados) | Não |
| `core/clock.js` | Data e hora em português e matriz de calendário, sem `Intl` | Não |
| `data/catalog.js` | Catálogo de atalhos (**simulado**) com status de verificação | Não |
| `data/library-provider.js` | Contrato da biblioteca de mídia e provedores `empty` / `demo` / `error` (**simulados**) | Não |
| `platform/browser-adapter.js` | Adaptador de **simulação** para navegador de computador | Sim (window) |
| `ui/render.js` | Gera o DOM a partir dos descritores de linha, aplica o foco e rola a tela | Sim |
| `screens/*.js` | Cada tela devolve uma lista de **descritores de linha**, sem manipular o DOM diretamente | Não* |
| `app.js` | Inicialização, laço de teclas, renderização, cabeçalho, avisos e escala da tela | Sim |

\* As linhas `custom` recebem uma função `render(node, el)` que desenha conteúdo próprio
(relógio, calendário etc.).

Os módulos **sem DOM** são carregados no Node pelos testes unitários
(`prototype/tests/unit/load.js`), sem navegador.

## Descritor de linha

```js
{ id: 'favoritos', title: 'Favoritos', kind: 'cards',   // nav | hero | cards | options | buttons | custom
  items: [{ id, label, sub, monogram, badge, value, onSelect: function (ctx) {} }],
  anchor: 2,                 // opcional: coluna que recebe o foco ao entrar na linha
  render: function (node, el) {} }   // apenas kind 'custom' (não recebe foco)
```

`onSelect` recebe um `ctx` com: `open(tela, params)`, `back()`, `goToTab(id)`,
`rerender()`, `toast(msg)`, `prefs`, `logger`, `adapter`, `isOnline()`, `now()`,
`libraryProvider()`, `applyPreferences()` e `storageIsPersistent()`.

## Regras de navegação

- **Esquerda/direita** movem o foco dentro da linha e param nas pontas, sem dar a volta.
- **Cima/baixo** vão para a linha focável anterior ou seguinte, pulando as linhas
  informativas. Cada linha lembra a última coluna visitada.
- **Barra de abas**: é uma linha ancorada. Ao subir até ela, o foco vai para a **aba
  ativa**. Ao descer dela, o conteúdo começa na coluna lembrada ou na primeira.
- **OK/Enter** aciona `onSelect`. Nas abas, o foco permanece na aba; atalhos de conteúdo
  levam ao primeiro item da tela.
- **Return/Voltar**:
  1. com tela de detalhe aberta, desempilha e **restaura o foco anterior**;
  2. numa aba diferente de Início, volta ao Início;
  3. no Início, pede confirmação ("pressione novamente") e chama `adapter.exit()`.
- **Segurar uma seta** gera no máximo uma repetição a cada 150 ms. Segurar OK ou Voltar
  **não repete** a ação.

## Tela lógica e área segura

- A interface é desenhada numa tela lógica de **1280×720**, escalada por `transform:
  scale()` para caber na janela, mantendo 16:9 (com barras quando necessário).
- Margens de segurança de **64 px** na horizontal e **36 px** na vertical (5%). É um valor
  conservador contra o *overscan*. A resolução real do painel e a do app ainda são
  desconhecidas (D-01).
- A fonte base é de 24 px na tela lógica, ou 28 px no modo "Texto grande".

## Contrato do adaptador de plataforma

| Membro | Tipo | Descrição | Simulação (navegador) |
|---|---|---|---|
| `id`, `name` | string | Identificação exibida no diagnóstico | `browser-simulation` |
| `isSimulation` | boolean | Exibe o selo **SIMULAÇÃO** | `true` |
| `keymap` | `{keyCode: ação}` | Teclas físicas → `UP/DOWN/LEFT/RIGHT/ENTER/BACK` | setas, Enter, Backspace, Esc |
| `keyHints` | `{ok, back}` | Texto do rodapé | `Enter`, `Backspace / Esc` |
| `ready()` | função | Aviso de "app pronto" exigido pela plataforma (se houver) | nada |
| `storageBackend()` | função → objeto Storage ou `null` | Backend de persistência | `localStorage` testado |
| `isOnline()` | função → boolean | Estado de rede **informado pela plataforma** | `navigator.onLine` |
| `onConnectivityChange(cb)` | função | Notifica mudanças | eventos `online` e `offline` |
| `getSystemInfo()` | função → `[{label, value}]` | Dados do diagnóstico | resolução e user agent |
| `exit()` | função → boolean | Devolve o controle ao sistema. `false` se não houver suporte | `false` |

Um esboço não testado para a plataforma legada está em
[`platform/adapters/orsay-adapter.draft.js`](../platform/adapters/orsay-adapter.draft.js).

## Pontos de integração com a TV (pendentes)

| Ponto | Onde entra | Estado |
|---|---|---|
| Códigos das teclas do controle | `adapter.keymap` | Desconhecido. A medição está prevista no teste H-04 |
| Persistência | `adapter.storageBackend` | Desconhecido (D-08). O núcleo já degrada para memória |
| Rede | `adapter.isOnline` | Desconhecido |
| Ciclo de vida (pronto/sair) | `adapter.ready` / `adapter.exit` | Desconhecido |
| Mídia (USB/DLNA) | novo provedor em `data/library-provider.js` | Não comprovado. Hoje há só o contrato |
| Abertura de apps nativos | `onSelect` dos atalhos | Não comprovado. Hoje apenas informa |
| Empacotamento (`config.xml`, zip) | fora do protótipo | Não iniciado (ver [DEPLOYMENT.md](DEPLOYMENT.md)) |

## Diagnóstico e erros

- `window.onerror`, falhas ao montar telas e exceções em `onSelect` vão para o logger. A
  interface mostra um estado de erro ou um aviso e **não trava**.
- A tela Utilitários → Diagnóstico mostra os dados do adaptador, o tipo de armazenamento e
  os últimos registros.
- `prototype/diagnostics.html` é uma página autocontida que detecta recursos e captura
  códigos de tecla. Ela foi feita para o primeiro teste no navegador da TV.
