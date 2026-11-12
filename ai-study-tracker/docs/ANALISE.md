# Análise dos prints e planejamento

> Fonte: 20 prints enviados em 12/11/2026 (página da formação **Engenheiro de Agentes de IA**, Asimov Academy).
> Regra seguida: **nada foi inventado**. O que não aparece nos prints está marcado como **[VERIFICAR]**.

## ETAPA 1 — Extração (o que os prints mostram)

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

**Agrupamento em trilhas:** cada grupo tem uma sequência própria de posições (#2→#5, #3→#4, …).
Dois cards com a mesma posição (#3) não podem estar na mesma trilha, logo há **ao menos 6 trilhas
distintas** visíveis (A–F). As trilhas 7 e 8 não aparecem. Nomes e ordem das trilhas: **[VERIFICAR]**.

## ETAPA 2–3 — Normalização, IDs e duplicidades

| ID | Curso | Trilhas |
|---|---|---|
| GENAI-001 | Fundamentos da IA Generativa (introdutório) | T1 |
| CLAUDE-001 | Claude Desktop | T1 |
| CLAUDE-002 | Claude Avançado: Skills, Conectores, Artefatos e SubAgents | T1 |
| **CODE-001** | **Masterclass Claude Code** | **T1 + T6 (repetido)** |
| CODE-002 | Claude Code na prática | T6 |
| OPENCLAW-001 / 002 | Dominando o OpenClaw / Assistente pessoal com OpenClaw | T2 |
| HERMES-001 | Hermes Agent | T3 |
| GPT-001 | Criando agentes com GPT | T4 |
| PY-001 / PY-002 | Pensando como um Programador / Coder Toolbox | T5 |
| UI-001 | Masterclass - Interfaces Absurdas com IA | T5 |
| LANG-001 / 002 | Sistemas Agenticos com Langchain / Langclean | T5 |
| IDE-001 / 002 / 003 | Antigravity / Cursor 3 / CursorAI | T6 |

- **Conteúdo repetido (mesmo curso):** `CODE-001` em T1 (#4) e T6 (#5): conta **1x**, aparece nas duas trilhas.
- **Sobreposição temática (cursos diferentes):** Cursor 3 × CursorAI; Masterclass Claude Code × Claude Code na prática; OpenClaw ×2. Não são duplicados, mas a prática do segundo curso foi reduzida.
- **[VERIFICAR]:** posições #1 (T1, T6) e #1–#2 (T2–T5) — **10 posições** não visíveis. É provável que algumas sejam cursos introdutórios compartilhados (ex.: o próprio *Fundamentos da IA Generativa*), o que reduziria a carga única.

## ETAPA 4 — Carga horária

| Medida | Valor |
|---|---|
| Carga bruta declarada | **62h34** |
| Visível nos prints (bruto, 18 aparições) | 30h16 |
| Visível nos prints (único, 17 cursos) | 29h50 |
| Repetido economizado | 26 min |
| **Reserva não mapeada** (62h34 − 30h16) **[VERIFICAR]** | **32h18** (modelada como Trilhas 7–8) |
| **Conteúdo único estimado** | **62h08** |

Sem lista de aulas, cada curso foi dividido em **blocos de ~40 min** para o planejamento (91 blocos).
A duração total de cada curso é real; a divisão é só um recurso de planejamento.

## ETAPA 5 — Carga além do vídeo

Prática por natureza do curso (você já domina Python/APIs, então fundamentos de programação têm pouca prática):

| Natureza | Prática / vídeo | Exemplos |
|---|---|---|
| conceitual | 30% | Fundamentos da IA Generativa |
| técnico (Python já dominado) | 15–25% | Pensando como Programador, Coder Toolbox |
| ferramenta | 25–60% | Claude Desktop, Cursor, Antigravity, Claude Code |
| agentes | 50–80% | GPT, Hermes, OpenClaw, LangChain, Claude Avançado |
| projeto | 70% | Langclean, Assistente OpenClaw |
| reserva | 45% | Trilhas 7–8 [VERIFICAR] |

AI Agent Lab: 9 estágios, **34h30** (Fundamentos/Prompt → API → AI Build → Tool Calling → Agent → RAG → Multi-Agent → AI App → Projeto Final).
Revisão espaçada D+1/D+7/D+30: **12h23** (≈9% do total).

## ETAPA 6 — Resumo do planejamento

```
Carga de vídeo:      62h 34min (bruta)
Conteúdo único:      62h 08min
Prática estimada:    30h 05min
Projetos:            34h 30min
Revisão:             12h 23min
Carga total:        139h 06min

Período:   13/11/2026 → 27/01/2027
Dias de estudo:   63
Dias de descanso: 13 (domingos + 25/12 e 01/01; 24/12 e 31/12 com meia carga)
Média:            2h12 por dia de estudo
Rotina:           Seg/Ter/Qui 2h15 · Qua 2h · Sex 1h45 · Sáb 3h30 (projeto) · Dom descanso
Fazer ÷ assistir: 1,04× (prática + projeto ≥ vídeo)
```

## ETAPA 7 — Cronograma

Dia a dia em [`CRONOGRAMA.md`](CRONOGRAMA.md) (gerado por `scripts/export_schedule.py`). No app, ele é adaptativo.

## ETAPA 8 — Por que é sustentável

- **~2h nos dias úteis** fica no meio da faixa que você indicou (1h30–2h30) e é mantível por 10+ semanas; o sábado (3h30) concentra o Lab, onde o aprendizado vira competência.
- **Terminar até 13–15/01** exigiria ~2h45 nos dias úteis e 3h45 aos sábados (média de 2h43) durante 9 semanas que incluem Natal e Ano-Novo. Isso fica acima do sustentável e sacrificaria prática. A recomendação é **27/01**, 12 dias depois de "meados de janeiro".
- **A data é um teto conservador:** 32h18 são reserva para conteúdo não visível. Se parte dela for curso repetido entre trilhas, o término antecipa automaticamente quando o catálogo for completado.
- Revisões curtas (≈15 min/dia), um descanso completo por semana e meia carga nas vésperas de feriado reduzem fadiga cognitiva.
