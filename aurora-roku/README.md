# Aurora TV

Central de entretenimento pessoal para **Roku Express 3960BR**, em **BrightScript +
SceneGraph**. É um aplicativo independente, aberto pelo sistema Roku. **Não substitui a
tela inicial do Roku.**

> **Primeira versão demonstrativa.** Títulos, sinopses, anos, durações e progresso são
> **fictícios**, e as imagens são arte original gerada localmente. Não há streaming,
> contas, rede ou integração externa. Nada foi instalado no Roku físico.

![Tela inicial no simulador](docs/screenshots/01-inicio.jpg)

*Captura do **simulador brs-engine** (de terceiros), configurado como 3960X em 720p. A
renderização no aparelho pode diferir.*

## Estado atual

| Área | Estado |
|---|---|
| Telas: Início, Filmes, Séries, Minha biblioteca, Favoritos, Configurações, Detalhes | Implementadas |
| Navegação por controle remoto (setas, OK, Voltar) com restauração de foco | Implementada; verificada no simulador (22/22) |
| Favoritos com persistência local (registro do Roku) | Implementados; persistência verificada no simulador |
| Dois temas (Aurora Noturna / Aurora Boreal) | Implementados; a troca funciona |
| Diagnóstico (modelo, Roku OS, resolução) | Implementado; lê os valores do aparelho |
| Execução no Roku Express 3960BR | **Não testada** (fora do escopo desta etapa) |

## Tecnologias

- **BrightScript** e **SceneGraph (XML)**: a tecnologia nativa da plataforma. Nenhuma
  biblioteca de terceiros vai no app.
- Ferramentas de desenvolvimento (só no computador, nada vai para o aparelho):
  - **BrighterScript `bsc`** e **bslint** (RokuCommunity): compilação, validação e lint.
  - **brs-cli** (brs-node): testes de lógica em BrightScript.
  - **brs-engine + brs-scenegraph**: simulador de terceiros, executado no Chromium via
    Playwright.
  - **Python + Pillow/NumPy**: geração da arte original.

## Estrutura

```
aurora-roku/
├── manifest                    # metadados do app (lido pelo Roku)
├── source/                     # thread principal
│   ├── main.brs                # cria a cena, publica o estado global e grava no registro
│   ├── Persistence.brs         # roRegistrySection (tema + favoritos)
│   └── shared/                 # lógica pura, usada também pelos componentes e pelos testes
│       ├── Theme.brs           # identidade: nome, temas, cores, tipografia, imagens de UI
│       ├── DemoContent.brs     # catálogo DEMONSTRATIVO (dados fictícios)
│       ├── NavigationLogic.brs # máquina de estados da navegação
│       ├── AppStateLogic.brs   # regras de favoritos e validação do estado salvo
│       └── Util.brs
├── components/                 # thread de renderização (SceneGraph)
│   ├── MainScene.xml/.brs      # raiz: camadas, Voltar, foco barra ↔ conteúdo
│   ├── NavigationBar.xml/.brs  # marca + abas
│   ├── HomeScreen.xml/.brs     # destaque + fileiras
│   ├── HeroSection.xml/.brs    # bloco de destaque
│   ├── CatalogScreen.xml/.brs  # Filmes, Séries, Biblioteca e Favoritos (um componente)
│   ├── DetailsScreen.xml/.brs  # camada de detalhes
│   ├── SettingsScreen.xml/.brs # opções + diagnóstico
│   ├── ContentCard.xml/.brs    # item dos RowList
│   ├── PillButton.xml/.brs     # abas, botões, opções
│   ├── Toast.xml/.brs          # avisos curtos
│   └── shared/                 # Ui.brs (fontes, tema, favoritos), ContentBuilder.brs
├── images/                     # arte original gerada (posters, backgrounds, ui/<tema>, brand)
├── tests/                      # LogicTests.brs + checklist manual para o aparelho
├── tools/                      # gerador de arte, verificador, empacotador, simulador
├── docs/screenshots/           # capturas do simulador
├── README.md · SOURCES.md · PLATFORM_COMPATIBILITY.md · TEST_PLAN.md · DESIGN_SYSTEM.md
└── package.json · bsconfig.json · bslint.json   # só ferramentas de desenvolvimento
```

### Ajustes em relação à estrutura proposta

| Proposta | Implementado | Motivo |
|---|---|---|
| `source/AppState.brs`, `NavigationManager.brs`, `DemoContent.brs` | `source/shared/AppStateLogic.brs`, `NavigationLogic.brs`, `DemoContent.brs` + `source/Persistence.brs` | Os arquivos de `source/` rodam na thread principal. A lógica pura fica em `source/shared/` e é incluída pelos componentes via `<script uri>` (uma única fonte da verdade), além de ser testável no computador |
| `ContentRow.xml` | `RowList` nativo + `ContentCard` | O RowList oficial já gerencia foco, rolagem e memória das fileiras |
| `LibraryScreen.xml`, `FavoritesScreen.xml` | `CatalogScreen` com `kind="library"` / `"favorites"` | O layout, o foco e o painel são iguais; só a fonte de dados muda. Evita duplicar código |
| `images/icons/` | `images/brand/` e `images/ui/<tema>/` | A UI usa texto em vez de ícones; as pílulas e painéis 9-patch são por tema |
| — | `PillButton`, `Toast`, `CatalogScreen` | Componentes reutilizáveis necessários |

## Arquitetura e foco

- **Um dono do foco por região.** O `RowList` nativo trata as setas dentro das fileiras.
  `HeroSection`, `DetailsScreen`, `SettingsScreen` e `NavigationBar` tratam as próprias
  setas e o OK. Teclas não tratadas sobem pela cadeia de foco (documentado pela Roku) até
  o `MainScene`.
- **Só o `MainScene` trata o Voltar** e a passagem de foco entre a barra de abas e o
  conteúdo. As decisões vêm de `NavigationLogic.brs`, uma lógica pura e testada.
- As pílulas **nunca** recebem foco do sistema: o componente pai as realça.
- **Restauração de foco:** os detalhes abrem como camada sobre a aba. Ao voltar, a aba
  devolve o foco ao `RowList`, que preserva o item focado.
- **Estado global:** `m.global.themeId` e `m.global.favorites`. A thread principal
  observa esses campos e grava no registro. As telas descartáveis liberam os observadores
  (`unobserveFieldScoped`) em `dispose()`.

### Máquina de estados de navegação

Estado: `tab` (aba ativa), `zone` (`nav` = barra de abas, `content` = conteúdo,
`overlay` = detalhes) e `overlay` (`none` ou `details`).

```
                       ┌──────────── OK no cartão ────────────┐
                       │                                      ▼
 [nav] ──Baixo──▶ [content] ◀──────── Voltar ─────────── [overlay: details]
   ▲  ◀──Cima (topo)──┘  │                                (fecha e restaura o foco)
   │                     │
   │  OK numa aba: troca a aba e mantém o foco em [nav]
   │  Coleção no Início: troca para Filmes/Séries e vai para [content] na fileira
   │
 Voltar:
   overlay aberto ............................ fecha os detalhes   → [content]
   aba ≠ Início (nav ou content) ............. volta ao Início      → [nav]
   Início, content ........................... sobe para a barra   → [nav]
   Início, nav ............................... não trata: o Roku encerra o app
 Home: tratado pelo sistema Roku (o app não intercepta)
```

Transições dentro do Início: **destaque ⇄ fileiras** (Baixo/Cima), com o conteúdo subindo
531 px em 0,3 s.

Garantias verificadas:

- Voltar repetido sempre termina no encerramento, em no máximo 3 passos e sem ciclos
  (teste de lógica).
- O foco nunca vai para uma região vazia: em Favoritos vazio, Baixo não sai da barra.
- Nas pontas, esquerda/direita são consumidas e o foco não "escapa".

## Como abrir e validar

Pré-requisitos: Node.js 20+ e Python 3 com Pillow e NumPy (só para regenerar a arte).
Playwright com Chromium é opcional, para o simulador.

```bash
cd aurora-roku
npm install                       # ferramentas de desenvolvimento
npm test                          # bsc + bslint + verificador do projeto + 32 testes de lógica
npm run simulate                  # executa o app no simulador e salva capturas em tools/simulator/output/
python3 tools/package.py          # gera out/aurora-tv.zip (manifest, source, components, images)
python3 tools/generate_assets.py  # regenera a arte (determinística)
```

Para editar: qualquer editor serve. A extensão BrightScript para VS Code (RokuCommunity)
usa o mesmo `bsconfig.json`.

## Funcionalidades demonstrativas

- Catálogo de 8 filmes e 6 séries **fictícios**, mais 4 coleções, todos com arte original.
- "Assistir"/"Continuar" **não reproduz nada**: mostra "Conteúdo demonstrativo: a
  reprodução não está disponível nesta versão."
- Biblioteca com progresso e episódios fictícios.
- Favoritos e tema são reais (persistem no registro do aparelho).

## Documentos

- [SOURCES.md](SOURCES.md): fontes, datas e o que é leitura direta × resumo de busca.
- [PLATFORM_COMPATIBILITY.md](PLATFORM_COMPATIBILITY.md): aparelho, recursos, o que falta
  confirmar no hardware e limites do simulador.
- [TEST_PLAN.md](TEST_PLAN.md): testes executados e não executados, critérios e roteiro
  para o aparelho.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): paleta, tipografia, espaçamentos, foco e regras.
- [tests/manual-test-checklist.md](tests/manual-test-checklist.md): checklist para o
  Roku físico.
