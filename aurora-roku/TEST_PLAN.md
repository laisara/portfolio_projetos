# Plano de testes — Aurora TV

> **Executado** significa que a ferramenta rodou e o resultado está registrado abaixo.
> **Inspecionado** significa que só o código foi lido. Nenhum teste rodou no Roku físico.
> O simulador usado é de terceiros e **não é o Roku OS** (ver PLATFORM_COMPATIBILITY.md).

## Como executar

```bash
cd aurora-roku
npm install                       # ferramentas de desenvolvimento (nada vai para o aparelho)
npm test                          # compilação + lint + verificação do projeto + testes de lógica
npm run simulate                  # roteiro no simulador (requer Playwright e Chromium)
python3 tools/package.py          # gera out/aurora-tv.zip (só manifest, source, components, images)
```

`npm run simulate` usa uma instalação existente do Playwright (local ou via `NODE_PATH`).
Ele não é dependência do projeto.

## 1. Testes executados

Execução de 23/10/2026: Node 22.22.0, Python 3 com Pillow 12.3 e NumPy 2.5, Chromium do
Playwright 1.63.

| ID | Teste | Ferramenta | Resultado |
|---|---|---|---|
| T1 | Compilação e validação de BrightScript e XML (sintaxe, `extends`, `<script uri>`, funções inexistentes) | `bsc` (BrighterScript 0.73.8) | **0 erros** |
| T2 | Lint com regras de defeitos (variável não usada, caminhos sem atribuição, código inalcançável, retorno inconsistente, `stop`) e **cores só no tema** | `bslint` 0.8.47 como plugin do `bsc` | **0 diagnósticos** |
| T2b | Sanidade do lint: um arquivo de prova com variável não usada e cor fora do tema foi **rejeitado** (BSLINT1005 e BSLINT3019) e depois removido | `bslint` | Aprovado |
| T3 | Verificação do projeto: estrutura, manifest, dimensões de ícone/splash, nós usados, callbacks, imagens de cada título/coleção/tema, 9-patch, ausência de URL/credencial, mensagens de conteúdo demonstrativo, grade de 3 px, coerência de cores tema × gerador de arte | `tools/check-project.js` | **0 erros, 0 avisos** |
| T4 | Lógica pura: hierarquia do Voltar, transições de estado, ausência de ciclos, favoritos, validação de estado corrompido, temas, consistência do catálogo | `brs-cli` (brs-node 2.6.1) executando `tests/unit/LogicTests.brs` | **32/32** |
| T5 | **Execução do app** com roteiro de navegação usando só as teclas do controle (up/down/left/right/select/back), com verificação pelos rastros `AURORA_*` | brs-engine 2.6.1 + brs-scenegraph 0.6.1 em Chromium headless (`tools/simulator/`) | **22/22 verificações, 0 erros de console, em 4 execuções seguidas** (após corrigir a corrida do harness) |
| T6 | Empacotamento | `tools/package.py` | `out/aurora-tv.zip` gerado (≈2,6 MB) |

Configuração do dispositivo simulado no T5: `deviceModel: "3960X"`, `displayMode: "720p"`.

### Verificações do roteiro T5

| # | Verificação | Resultado |
|---|---|---|
| 1 | App inicia na tela Início | ok |
| 2 | Cima no destaque sobe para a barra de abas | ok |
| 3 | OK na aba Favoritos abre a aba e mantém o foco na barra | ok |
| 4 | Baixo em Favoritos vazio não move o foco (nada a focar) | ok |
| 5 | Voltar em outra aba retorna ao Início | ok |
| 6 | Baixo na barra entra no conteúdo | ok |
| 7 | OK num cartão abre os detalhes | ok |
| 8 | Favoritar pelos detalhes mostra o aviso | ok |
| 9 | Ação principal avisa que o conteúdo é demonstrativo | ok |
| 10 | Voltar fecha os detalhes | ok |
| 11 | Foco restaurado no cartão de origem (Órbita Baixa) | ok |
| 12 | Coleção abre a aba Filmes com foco no conteúdo | ok |
| 13 | Detalhes a partir de Filmes | ok |
| 14 | Foco restaurado na fileira "Drama e romance" | ok |
| 15 | Cima na primeira fileira sobe para a barra | ok |
| 16 | Favoritos com item recebe o foco | ok |
| 17 | Configurações recebe o foco | ok |
| 18 | Tema alternado (Aurora Boreal) | ok |
| 19 | Biblioteca recebe o foco | ok |
| 20 | Voltar na Biblioteca volta ao Início (barra) | ok |
| 21 | Voltar na barra do Início encerra o app (`EXIT_USER_NAV`) | ok |
| 22 | Favorito e tema persistem ao relançar o app (registro) | ok |

Capturas geradas: `tools/simulator/output/*.png` (15 telas). Uma seleção está em
`docs/screenshots/`.

### Correspondência com os testes obrigatórios do escopo

| Item do escopo | Coberto por |
|---|---|
| 1. Consistência da estrutura de arquivos | T3 |
| 2. Presença e validade básica do manifest | T3 (atributos obrigatórios, formato, imagens e dimensões), T5 (o simulador leu o manifest) |
| 3. Nomes de componentes XML × arquivos referenciados | T1, T3 |
| 4. Existência dos arquivos de recursos | T3 (estáticos e montados a partir do catálogo e dos temas) |
| 5. Sintaxe e consistência de BrightScript e SceneGraph | T1, T2, T5 |
| 6. Transições entre telas | T4 (lógica), T5 (execução) |
| 7. Navegação e foco | T4, T5 e inspeção da máquina de estados (README) |
| 8. Favoritos e retorno de telas | T4, T5 (#8, #10, #11, #14, #16, #22) |
| 9. Ausência de URLs ou credenciais obrigatórias | T3 (varredura de todo o código do app) |
| 10. Mensagens claras de conteúdo demonstrativo | T3 (presença das mensagens), T5 (#9 e capturas) |

## 2. Defeitos encontrados e corrigidos durante os testes

| Encontrado por | Defeito | Correção |
|---|---|---|
| T1 | `tab` usado como variável (é função interna do BrightScript) | Renomeado |
| T1 | Variável `layout` com o mesmo nome de uma função no escopo do componente | Renomeada; função do PillButton passou a `relayout` |
| T5 | Nenhum texto aparecia: `Font.uri = "font:BoldSystemFontFile"` não era aceito | Fontes predefinidas do sistema + ajuste de tamanho, num único helper |
| T5 | **Crash** ao favoritar: a tela de Favoritos removida continuava observando `m.global.favorites` | `observeFieldScoped` + `dispose()` com `unobserveFieldScoped` nas telas descartáveis; botões e cartões deixaram de observar o nó global; proteção contra estado inválido |
| T5 (capturas) | Voltar ao Início a partir de outra aba mostrava o Início recolhido | `resetView()` ao entrar no Início |
| T5 (capturas) | Sinopse do destaque encostava no anel do planeta | Texto mais estreito e arte ajustada |
| T5 (harness) | Falha intermitente do **simulador** ("invalid zip data"): o `initialize` baixava os arquivos de sistema sem aguardar, numa corrida com o início do app | O harness baixa `common.zip` antes e o entrega em `DeviceInfo.assets`; depois disso, 4/4 execuções limpas. Não era defeito do app |

## 3. Testes NÃO executados

| Teste | Motivo |
|---|---|
| Qualquer teste no Roku Express 3960BR | Proibido nesta etapa (sem modo dev, sem sideload, sem comandos de rede) |
| Roku Cloud Emulator | Exige conta de desenvolvedor (credenciais pessoais) |
| Desempenho e memória reais (`r2d2_bitmaps`, fps) | Só no aparelho |
| Renderização real das fontes e dos 9-patch | O simulador usa fontes e renderização próprias |
| Teclas além de setas, OK e Voltar (Home, Opções `*`, reprodução, voz) | Home é do sistema; as demais não são usadas pelo app |
| Tecla mantida pressionada (repetição) | Não é simulada pelo roteiro |
| Instant Resume / retomada após sair | Comportamento do sistema; só no aparelho |
| Overscan e legibilidade a 3 m numa TV real | Só no aparelho |
| Certificação da Roku | Fora do escopo (o app não será publicado) |

## 4. Critérios de aprovação

**Para revisão (esta etapa)** — atendidos:
- T1, T2 e T3 sem erros; T4 com 100% aprovado; T5 com 22/22 e console sem erros.
- Todo conteúdo fictício identificado na interface e no código.
- Nenhuma URL ou credencial; o app abre sem rede.

**Para considerar o app funcional no aparelho** (futuro):
- Todos os itens de `tests/manual-test-checklist.md` aprovados no 3960BR.
- Nenhum crash no console de depuração (porta 8085) durante o roteiro.
- Rolagem das fileiras sem travamentos perceptíveis com a tecla mantida pressionada.
- Textos legíveis a cerca de 3 m e nada cortado pelo overscan.

## 5. Roteiro futuro para teste no Roku físico (requer autorização explícita)

1. **Preparar:** `npm test`, `npm run simulate` e `python3 tools/package.py`. Confira o
   tamanho de `out/aurora-tv.zip`.
2. **O usuário** ativa o modo de desenvolvedor pelo controle (sequência em R4) e define a
   senha. Isso reinicia o aparelho.
3. **O usuário** abre o instalador web (IP mostrado pelo aparelho), entra com o usuário
   `rokudev` e envia `out/aurora-tv.zip`.
4. Executar `tests/manual-test-checklist.md` com o controle remoto real.
5. Opcional: acompanhar o console de depuração (porta 8085, somente leitura) para ver os
   rastros `AURORA_NAV`, `AURORA_FOCUS` e `AURORA_TOAST`.
6. Ao terminar: remover o app pelo instalador e, se desejado, desativar o modo de
   desenvolvedor pela mesma sequência de teclas.

## 6. Riscos e precauções

| Risco | Precaução |
|---|---|
| **Só um app instalado por sideload por vez: um novo sideload substitui o anterior** (R4) | Antes de enviar, confirmar que não há outro app em desenvolvimento no aparelho que precise ser preservado |
| Reinstalar a mesma versão gera erro (R4) | Incrementar `build_version` no manifest ou remover o app antes |
| Ativar o modo de desenvolvedor reinicia o aparelho (R4) | Fazer fora de horário de uso |
| Instalador exposto na rede local | Senha forte; desativar o modo dev depois dos testes |
| Diferenças entre simulador e aparelho | Tratar o roteiro do simulador como pré-teste, nunca como aprovação final |
| Persistência no registro | O app só grava tema e ids de favoritos; remover o app apaga os dados |
