# Compatibilidade com a plataforma

Registro da compatibilidade **verificada** de cada API, biblioteca e ferramenta.
Atualize esta tabela a cada teste no aparelho, indicando data, método e evidência.

Estados possíveis: **Confirmada** · **Provável** · **Desconhecida** · **Incompatível** ·
**Simulada** (existe só no protótipo do computador).

Última atualização: 23/10/2026. **Nenhum teste foi feito na TV.**

## Ambiente de execução

| Item | Navegador do PC (protótipo) | TV UN48H4203AG | Evidência |
|---|---|---|---|
| Motor do navegador/app | Chromium (Playwright) | Desconhecida (Maple × WebKit) | [C10][C11] conflitantes |
| ECMAScript 5 (sintaxe) | Confirmada | Desconhecida | Teste H-03 pendente |
| `JSON.parse` / `JSON.stringify` | Confirmada | Desconhecida | H-03 |
| `localStorage` | Confirmada | Desconhecida (D-08) | H-03 |
| `navigator.onLine` + eventos online/offline | Confirmada | Desconhecida | H-03 |
| CSS `transform` / `transition` (com prefixo `-webkit-`) | Confirmada | Desconhecida | H-03 |
| CSS flexbox, grid, variáveis, `calc()` | Não usados | — | Evitados por precaução |
| `addEventListener('keydown')` | Confirmada | Desconhecida | H-04 |
| Resolução da tela / do app | 1280×720 lógico, escalado | Desconhecida (D-01) | — |

## Teclas

| Ação | PC (simulação) | Controle da TV | Evidência |
|---|---|---|---|
| Cima/baixo/esquerda/direita | setas (38/40/37/39) | Desconhecida | H-04 |
| OK | Enter (13) | Desconhecida | H-04 |
| Voltar | Backspace (8), Esc (27) | Desconhecida (tecla Return) | H-04 |
| Sair | — | Desconhecida (tecla Exit) | H-04 |

> Os códigos numéricos do controle **não** foram fixados no código. No adaptador real,
> devem vir da plataforma (por exemplo, de um objeto de constantes de teclas, se existir)
> ou da medição do teste H-04.

## APIs específicas Samsung (plataforma legada)

| API | Estado | Observação |
|---|---|---|
| `Common.API.Widget` (`sendReadyEvent`, `sendReturnEvent`) | Desconhecida | Nome conhecido da documentação legada. **Não conferido** nesta investigação. Usado só no rascunho com detecção de recurso |
| `Common.API.TVKeyValue` | Desconhecida | Idem |
| `Common.API.Plugin` (registro de teclas) | Desconhecida | Idem. Não usado |
| Plugins de mídia (player, USB, DLNA) | Desconhecida | Não usados. A biblioteca é só um contrato |

## Bibliotecas e ferramentas

| Item | Estado | Observação |
|---|---|---|
| Tizen Studio / pacotes `.wgt` | Incompatível (provável) | TVs pré-2015 são "Legacy Platform" [S3] |
| Samsung Smart TV SDK 5.0/5.1 | Desconhecida | Indicado para modelos 2014 [S1]. Disponibilidade não verificada (D-05) |
| Emulador do SDK 5.x | Desconhecida | D-07 |
| `cordova-sectv-orsay` / TOAST | Provável | Biblioteca oficial para Orsay [S4]. Não adotada |
| Loja Samsung Apps (publicação) | Incompatível | [S3] |
| User App Sync (conta `develop`) | Provável (geração 2014) / Desconhecida (este modelo) | [S1]. Teste H-06 |
| Navegador web da TV | Provável (série H) | [S9]. Teste H-02 |
| `acorn` (dev, PC) | Confirmada | Usado só na verificação ES5. Não vai para a TV |
| Playwright + Chromium (dev, PC) | Confirmada | Testes e2e. Não vai para a TV |

## Serviços de streaming

| Serviço | Estado neste modelo | Evidência |
|---|---|---|
| Netflix | Provavelmente indisponível | Página Samsung sobre TVs de 2014 ou anteriores [S7] |
| YouTube | Desconhecida | Há relatos de descontinuação em modelos antigos, sem fonte oficial para 2014 |
| Prime Video, Globoplay, Spotify | Desconhecida | Conferir na lista de apps da TV (D-10) |

O Smart Hub Personalizado **não** integra nem reproduz nenhum desses serviços. Os cartões
são atalhos informativos.
