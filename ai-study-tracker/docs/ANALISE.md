# Análise dos prints e planejamento

> Fonte: 20 prints enviados em 12/11/2026 (página da formação **Engenheiro de Agentes de IA**, Asimov Academy).
> Regra seguida: **nada foi inventado**. O que não aparece nos prints está marcado como **[VERIFICAR]**.

## O que os prints mostram

Cabeçalho: **62h 34min em vídeo · 8 trilhas**.

Os cards mostram **posição na trilha (#), título, instrutor (truncado), duração e inscritos**.
Os prints **não mostram**: nomes das trilhas, módulos, lista de aulas e duração por aula
(apenas "Ver 17 aulas" no card do Antigravity).

| Grupo (ordem dos prints) | # | Curso | Duração | Instrutor (truncado) |
|---|---|---|---|---|
| A | 2 | Fundamentos da IA Generativa | 1h32 | Rodri… |
| A | 3 | Claude Desktop | 2h56 | Marc… |
| A | 4 | Masterclass Claude Code | 0h26 | Rodrigo… |
| A | 5 | Claude Avançado: Skills, Conectores, Artefatos e SubAgents | 1h56 | Marcel… |
| B | 3 | Dominando o OpenClaw | 2h14 | Samu… |
| B | 4 | Criando um assistente pessoal com OpenClaw | 1h32 | Rodri… |
| C | 3 | Hermes Agent | 1h59 | Samu… |
| D | 3 | Criando agentes com GPT | 0h47 | Rodrigo… |
| E | 3 | Pensando como um Programador (usando Python e IA) | 2h16 | Rodrig… |
| E | 4 | Coder Toolbox - Conceitos essenciais para programar com IA | 2h37 | Rodri… |
| E | 5 | Masterclass - Criando Interfaces Absurdas com IA | 0h25 | Lucas Pe… |
| E | 6 | Criando Sistemas Agenticos com Langchain | 1h51 | Rodrig… |
| E | 7 | Langclean - Um agente de limpeza do computador | 0h57 | Rodrigo Ta… |
| F | 2 | Dominando o Antigravity (17 aulas) | 2h16 | Myka… |
| F | 3 | Cursor 3 - Desenvolvimento Assistido por IA | 1h51 | Daniel… |
| F | 4 | CursorAI - ganhe 10x mais produtividade com a IDE de IA | 1h33 | Vivian… |
| F | 5 | Masterclass Claude Code | 0h26 | Rodrigo… |
| F | 6 | Claude Code na prática: evoluindo um projeto com IA | 2h42 | Danie… |

**Agrupamento (INFERIDO):** cada grupo tem uma sequência própria de posições (#2→#5, #3→#4, …).
Dois cards com a mesma posição (#3) não podem estar na mesma trilha, logo há **ao menos 6 trilhas
distintas** visíveis (A–F). As trilhas 7 e 8 não aparecem. Nomes e ordem das trilhas: **[VERIFICAR]**.

## Correção de 12/11 (fase 1 da auditoria)

A primeira versão criou duas coisas que **não vêm dos prints** e foram removidas:

| Antes (errado) | Agora |
|---|---|
| "Reserva" de 32h18 (Trilhas 7–8 fictícias) | **Nada é cadastrado nem agendado.** As 32h18 aparecem só como número de auditoria: **[NÃO IDENTIFICADO]** |
| 91 blocos sintéticos de ~40 min | Cada curso é **uma unidade com a duração real do print**. As sessões de ≤45 min existem só no cronograma, recalculadas a cada dia |
| Trilhas T1–T6 com nomes ("Fundamentos + Claude"…) e cursos associados | **8 trilhas "A confirmar"**, sem nome e sem cursos. Cada curso mostra `Trilha: [VERIFICAR]` |

### Classificação dos dados

| Dado | Status |
|---|---|
| Título, duração, posição do card, instrutor (truncado), nº de aulas do Antigravity (17) | **CONFIRMADO** (prints) |
| 62h34 e "8 trilhas" | **CONFIRMADO** (cabeçalho) |
| Mesmo curso nos cards #4 e #5 (*Masterclass Claude Code*: mesmo título, duração, instrutor e inscritos) | **CONFIRMADO** como duplicidade; trilhas **A VERIFICAR** |
| Agrupamento dos cards em sequências (A–F) | **INFERIDO** (posições consecutivas/repetidas); mostrado só como dica, nunca como trilha |
| Ordem de estudo sugerida | **INFERIDO** (sugestão do sistema) |
| Nome e conteúdo de cada trilha; módulos e títulos de aulas; cursos das posições #1/#2; trilhas 7–8 | **NÃO IDENTIFICADO** / **A VERIFICAR** |
| Percentual de prática por curso; pontos de partida das competências; horas do Lab | **ESTIMATIVA DO SISTEMA** (editáveis) |

## Os quatro números da carga

```
Carga declarada da formação ........ 62h34   (cabeçalho do print)
Carga identificada nos prints ...... 30h16   (18 aparições de 17 cursos)
Conteúdo duplicado ................. 0h26    (Masterclass Claude Code, 2x)
  → conteúdo único identificado .... 29h50   (17 cursos)
Conteúdo ainda não identificado .... 32h18   = declarada − identificada bruta  [NÃO IDENTIFICADO]
                                     (32h44 se a plataforma somou só conteúdo único) [VERIFICAR]
```

## Cursos e IDs

Ver `data/catalog.json`. IDs: GENAI-001, CLAUDE-001/002, CODE-001/002, OPENCLAW-001/002, HERMES-001, GPT-001, PY-001/002, UI-001, LANG-001/002, IDE-001/002/003. O mesmo ID em duas trilhas conta 1x na carga e no progresso.

## Planejamento (somente conteúdo identificado)

```
FORMAÇÃO (vídeo único) ...... 29h50
PRÁTICA (estimada) .......... 14h00
PROJETOS (AI Agent Lab) ..... 34h30
REVISÃO (D+1/D+7/D+30) ....   6h04
TEMPO TOTAL DE APRENDIZADO .. 84h24   (a formação é só 35%)

Início 13/11/2026 → fim do conteúdo identificado 28/12/2026
63 → 38 dias de estudo · 8 de descanso · média 2h13 · maior dia 3h38 · 32 cargas diárias diferentes
```

O cronograma completo está em `CRONOGRAMA.md`. Os 32h18 não identificados **não** estão incluídos; quando forem identificados, a data final se desloca. Como ordem de grandeza (hipótese, não dado): se fossem cursos de agentes com 30–50% de prática, o fim iria para ~25–27/01/2027.
