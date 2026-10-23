# Compatibilidade com a plataforma

Registro da compatibilidade **verificada** de cada API, biblioteca e ferramenta.
Atualize esta tabela a cada teste no aparelho, indicando data, método e evidência.

Última atualização: 23/10/2026 (Etapa 2). **Nenhum teste foi feito na TV.**

## Como ler os estados

| Estado | Significado |
|---|---|
| **Confirmada (testada)** | Testada de fato. Hoje só vale para o **navegador do computador** |
| **Confirmada para o modelo exato** | Evidência específica da UN48H4203AG(XZD). **Nenhuma ainda** |
| **Confirmada para a plataforma ou geração** | Documentação oficial da plataforma legada/2014, **sem** evidência do modelo exato. Vem de **resumos de busca** das páginas oficiais (leitura direta pendente, P-01) |
| **Indício indireto** | Inferência ou relato não oficial |
| **Desconhecida** | Sem evidência; depende de leitura ou teste |
| **Incompatível** | Evidência suficiente de que não funciona |
| **Não usada** | O protótipo evita o recurso por precaução |

Referências [F#], [S#], [C#]: ver [`research/SOURCES.md`](../research/SOURCES.md).

## Ambiente de execução

| Item | Navegador do PC (protótipo) | TV UN48H4203AG | Evidência |
|---|---|---|---|
| Plataforma de apps | — | **Confirmada para a plataforma ou geração:** *Samsung Smart TV Legacy Platform* (modelos 2010–2014). Modelo exato: **Desconhecida** (página do modelo não lida) | [F1][F4][S16] |
| Motor de renderização | Chromium (Playwright) | WebKit 537.42 segundo o user agent oficial da plataforma 2014 (**Confirmada para a geração**, resumo). Um navegador de usuário pode ser diferente: **Desconhecida** | [S21] |
| Navegador web da TV | — | **Desconhecida.** Indício indireto de que alguns modelos 2014 **não** têm navegador, de que o navegador embutido não suporta HTTPS e de que pode estar quebrado. *Corrige a Etapa 1* | [C14] |
| ECMAScript 5 (sintaxe) | Confirmada (testada) | **Indício indireto** (WebKit 537; nenhuma fonte oficial informa o nível) | [S21] |
| `JSON.parse` / `JSON.stringify` | Confirmada (testada) | Indício indireto (parte do ES5). Teste H-03 | — |
| `localStorage` | Confirmada (testada) | **Desconhecida.** A documentação encontrada afirma suporte só em versões **Tizen**; a referência HTML5 não indica plataformas | [S23][S26] |
| `navigator.onLine` + eventos online/offline | Confirmada (testada) | Desconhecida. Teste H-03 | — |
| CSS 2D `transform` (com `-webkit-`) | Confirmada (testada) | **Confirmada para a geração, parcial:** a tabela de CSS3 "2013 e 2014" marca a maioria dos itens de transformação como "Yes" e alguns como "No". Linhas não lidas. **O protótipo usa `transform: scale()` para ajustar a tela inteira** | [S22] |
| CSS `transition` (com `-webkit-`) | Confirmada (testada) | Desconhecida. É cosmético: o protótipo funciona sem ela | — |
| `@font-face` | Não usada | Confirmada para a geração ("desde os modelos 2014"); resumo | [S22] |
| CSS flexbox, grid, variáveis, `calc()` | Não usados | Desconhecida | Evitados por precaução |
| APIs HTML5 em geral | — | Confirmada para a geração, **parcial** (muitos itens "partial") | [S23] |
| `addEventListener('keydown')` no `document` | Confirmada (testada) | **Desconhecida** (como os eventos chegam ao app: D-13) | [S27] (seção só por título) |
| Resolução da tela / do app | 1280×720 lógico, escalado | Desconhecida (D-01) | — |

## Teclas

| Ação | PC (simulação) | Controle da TV | Evidência |
|---|---|---|---|
| Cima/baixo/esquerda/direita | setas (38/40/37/39) | Desconhecida | H-04 |
| OK | Enter (13) | Desconhecida | H-04 |
| Voltar | Backspace (8), Esc (27) | Desconhecida. A documentação legada diz que **Return, por padrão, volta ao Smart Hub** [S27]; **como interceptar** não foi lido (D-13) | H-04 |
| Sair | — | Desconhecida (tecla Exit) | H-04 |

> Os códigos numéricos do controle **não** foram fixados no código. No adaptador real, devem vir
> da plataforma (a documentação legada cita um objeto `Common.API.TVKeyValue` com constantes como
> `KEY_RETURN` [S27]) ou da medição do teste H-04. **Os valores numéricos não foram obtidos.**

## APIs específicas Samsung (plataforma legada)

| API | Estado | Observação |
|---|---|---|
| `Common.API.Widget` — `sendReadyEvent()` | **Confirmada para a plataforma** (resumo de página oficial) | O guia legado a usa "para iniciar o aplicativo". **Não testado**; usado só no rascunho, com detecção de recurso |
| `Common.API.Widget` — `sendReturnEvent()` | Confirmada para a plataforma (resumo) | Fecha o app e **volta ao Smart Hub**. Não é equivalente a "voltar uma tela" |
| `Common.API.TVKeyValue` (`tvKey.KEY_RETURN`, ...) | Confirmada para a plataforma (resumo) | Valores numéricos **não obtidos** |
| `Common.API.Plugin` (registro de teclas) | Desconhecida | Não confirmada. Não usada |
| Plugins de mídia (player, USB, DLNA) | Desconhecida | Não usados. A biblioteca é só um contrato |

O rascunho `platform/adapters/orsay-adapter.draft.js` continua **não testado** e fora do protótipo.

## Bibliotecas e ferramentas

| Item | Estado | Observação |
|---|---|---|
| Tizen Studio / pacotes `.wgt` | **Incompatível** | "Tizen Studio não empacota apps legados" [S16]; TVs até 2014 são "plataforma legada" [S3] |
| Samsung Smart TV SDK 5.0/5.1 | Confirmada para a geração (existência de documentação e emulador); **disponibilidade atual: Desconhecida** | O portal lista "SDK Emulator **5.1 Beta**" para 2014 [F1]. Disponibilidade do SDK completo não confirmada (D-05) |
| Requisitos do SDK 5.1 | **Confirmada para a geração (resumo):** Windows 7/XP SP2+, Linux (Ubuntu), Mac OS X, Oracle JDK 1.6+ | [S18][S20]. Em sistema atual: **Desconhecida**. **Não executar no computador principal** |
| Emulador do SDK 5.1 | Confirmada para a geração (existência, rótulo "Beta") | Fidelidade desconhecida (D-07) |
| `cordova-sectv-orsay` / TOAST | Confirmada (existência, GitHub oficial) | Não adotada |
| Loja Samsung Apps (publicação) | **Incompatível** | Submissão legada encerrada [S15] |
| User App Sync (conta `develop`) | **Confirmada para a geração.** Modelo exato / firmware 1090.0: **Desconhecida** | [S1][S19]. Sem nenhuma evidência para H4203/NT14M. Testes H-06/H-07 |
| Assinatura/certificado no User App Sync | Desconhecida | Não citada nos resumos (D-12) |
| Instalação por USB (`.sig`, `.wgt`, `.tmg`) | **Incompatível / sem evidência para 2014** | Restrita pela Samsung e dependente do Seller Office [F4][S24]. **Excluída** |
| Início automático / *prelaunch* | Desconhecida (sem mecanismo documentado para 2014) | *Prelaunch* é de Tizen 2015–2018 [S28]; Return volta ao Smart Hub [S27] |
| `acorn` (dev, PC) | Confirmada (testada) | Usado só na verificação ES5. Não vai para a TV |
| Playwright + Chromium (dev, PC) | Confirmada (testada) | Testes e2e. Não vai para a TV |

## Serviços de streaming

| Serviço | Estado neste modelo | Evidência |
|---|---|---|
| Netflix | Indício de indisponibilidade | Página Samsung sobre TVs de 2014 ou anteriores [S7] |
| YouTube | Desconhecida | Há relatos de descontinuação em modelos antigos, sem fonte oficial para 2014 |
| Prime Video, Globoplay, Spotify | Desconhecida | Conferir na lista de apps da TV (D-10) |

O Smart Hub Personalizado **não** integra nem reproduz nenhum desses serviços. Os cartões
são atalhos informativos.

## Riscos de compatibilidade registrados na Etapa 2 (sem alterar o protótipo)

| ID | Risco | Onde está no protótipo | Como será verificado |
|---|---|---|---|
| RC-01 | A tela é escalada com `transform: scale()`; se o ambiente não suportar, o layout quebra | `app.js` (`fitStage`) | H-03 |
| RC-02 | Return/Voltar pode **sair do app** em vez de voltar uma tela | `keys.js` / `app.js` (`BACK`) | D-13 (leitura) e H-04 |
| RC-03 | `localStorage` pode não existir | `storage.js` (já tem *fallback* para memória) | H-03 |
| RC-04 | `navigator.onLine` pode não existir; o indicador de conexão mostraria "Conectado" por padrão | `browser-adapter.js` | H-03 |
| RC-05 | Eventos de teclado podem exigir elemento com foco ou registro de teclas | `app.js` | D-13 e H-04 |
| RC-06 | A resolução real pode ser 1366×768; a escala 16:9 pode ficar com barras | `base.css` | D-01 |
