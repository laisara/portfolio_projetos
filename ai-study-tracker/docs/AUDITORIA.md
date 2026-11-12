# Relatório de auditoria — AI Engineer Study Tracker

Data: 12/11/2026 · Commit: `2e43cc8` · Branch: `ccr-97dc7c3e-vbe1hb` (repositório `laisara/portfolio_projetos`, pasta `ai-study-tracker/`)

## 1. Resumo

Foi entregue um PWA local-first (FastAPI + SQLite + HTML/CSS/JS sem build) com ~4.400 linhas de código (backend, frontend, testes e scripts), 31 endpoints e 29 funções de teste (33 casos com parametrização). O catálogo vem dos 20 prints recebidos, mas está **parcial**.

## 2. Fidelidade aos prints (ponto de maior risco)

**Extraído dos prints (conferir contra as imagens originais):**

| Curso | Duração | | Curso | Duração |
|---|---|---|---|---|
| Fundamentos da IA Generativa | 1h32 | | Criando Sistemas Agenticos com Langchain | 1h51 |
| Claude Desktop | 2h56 | | Langclean | 0h57 |
| Masterclass Claude Code (2x) | 0h26 | | Dominando o Antigravity (17 aulas) | 2h16 |
| Claude Avançado (Skills…SubAgents) | 1h56 | | Cursor 3 | 1h51 |
| Dominando o OpenClaw | 2h14 | | CursorAI | 1h33 |
| Assistente pessoal com OpenClaw | 1h32 | | Claude Code na prática | 2h42 |
| Hermes Agent | 1h59 | | Pensando como um Programador | 2h16 |
| Criando agentes com GPT | 0h47 | | Coder Toolbox | 2h37 |
| Masterclass - Interfaces Absurdas com IA | 0h25 | | **Total de 17 cursos únicos** | **29h50** |

**Premissas minhas, que NÃO estão nos prints (revisar):**
- **Agrupamento em trilhas T1–T6 e a ordem delas.** Deduzi pelas posições (#) e pela repetição do Masterclass Claude Code. O print não diz a que trilha cada card pertence.
- **Nomes das trilhas** ("Fundamentos + Claude", "OpenClaw" etc.) são rótulos meus; ficaram marcados `[NOME]`/[VERIFICAR].
- **Trilhas 7 e 8:** não aparecem. Modelei 32h18 (62h34 − 30h16) como reserva, dividida 16h09 / 16h09. Esse split é arbitrário.
- **Posições #1/#2 ausentes (10 posições):** tratadas como placeholders de duração zero; a carga delas está dentro da reserva.
- **Aulas e módulos:** não existem nos prints (exceto "17 aulas" do Antigravity). Cada curso foi dividido em blocos de ~40 min (91 blocos). Os títulos "parte X/Y" são sintéticos e marcados [VERIFICAR].
- **Nomes de instrutores** estão truncados como nos prints.

## 3. Parâmetros estimados (não vêm dos prints)

- Razão de prática por curso (15%–80% do vídeo, em `data/catalog.json`): julgamento meu, sem base empírica.
- Capacidade diária (Seg/Ter/Qui 135, Qua 120, Sex 105, Sáb 210, Dom 0 min), revisões D+1/7/30 com 3–10 min, feriados (24/12 e 31/12 a 50%; 25/12 e 01/01 a 0).
- Horas dos 9 estágios do Lab (34h30), conteúdo dos estágios, XP, níveis (limiares de 1.500 a 25.000 XP), 19 conquistas e linha de base das competências (p.ex. Python 70%). Tudo é configurável nos JSON/`domain.py`, mas são escolhas minhas.
- O "~2h45/dia para terminar em 13–15/01" foi medido com o próprio algoritmo (cenários 165/225 → 13/01), não é um limite científico de sustentabilidade.

## 4. Resultados do planejamento (reproduzível via `scripts/export_schedule.py`)

Vídeo único 62h08 · prática 30h05 · projetos 34h30 · revisão 12h23 · total 139h06 · 13/11/2026 → 27/01/2027 · 63 dias de estudo, 13 de descanso · média 2h12 · mais longo 3h34.

Observação: o término depende da reserva de 32h18. Se o catálogo real tiver cursos repetidos entre trilhas, o valor muda.

## 5. O que foi verificado

- `pytest`: 33 casos passando (planejador, catálogo, API, adaptatividade, backup/restore, PWA estático).
- Chrome (CDP): `getInstallabilityErrors` = 0, manifest sem erros, service worker ativo.
- Abertura offline testada em desktop e mobile emulados (após correção de um bug de fallback offline encontrado nesse teste).
- Screenshots reais gerados com Playwright/Chromium em 1440 px (desktop) e 390 px (mobile).

## 6. O que NÃO foi verificado

- **Windows:** `install.bat`, `start.bat`, `backup.bat`, `restore.bat` **nunca foram executados** (ambiente Linux). Foram escritos com CRLF; risco real de erro de sintaxe.
- **Android real / instalação do PWA em dispositivo:** não testado; só emulação. O fluxo HTTPS com mkcert do README é documentação, não testado.
- **Splash screen:** o print "09c" é uma simulação montada a partir do manifest, não uma captura real do Android.
- **Acessibilidade:** apenas boas práticas básicas (rótulos ARIA, foco visível, contraste visual); sem auditoria (axe/Lighthouse) nem teste com leitor de tela.
- **Performance:** não medida.
- **Concorrência/multiusuário:** não considerada (uso pessoal, uma instância).
- **Testes de interface (JS):** não há testes automatizados do frontend; foi validado por screenshots e inspeção.
- Os prints de demonstração usam um banco **simulado** (`scripts/demo_seed.py`); não são dados reais seus.

## 7. Limitações e riscos conhecidos

1. Catálogo parcial → cronograma e data final são provisórios até chegarem os prints faltantes.
2. O ID `AREA-001` e os IDs de aulas dos blocos sintéticos mudarão quando houver aulas reais; o progresso é preservado só por ID de aula igual.
3. `import_json` e `restore` substituem dados do usuário; há confirmação na UI e backup de segurança no restore, mas não no import JSON.
4. Servidor roda sem autenticação; com `--lan` qualquer dispositivo da rede acessa os dados.
5. O app acessa o relógio do sistema (`date.today`); `AST_TODAY` existe só para testes/demonstração.
6. Dependências de terceiros (fontes Inter/JetBrains Mono OFL, ícones Lucide ISC) foram baixadas via npm; licenças incluídas em `frontend/fonts` e `frontend/icons`.
7. Escopo ainda não coberto: a ordem do ciclo no cronograma (APRENDER/ENTENDER/CONSTRUIR/REVISAR/CONSOLIDAR) aparece como fase por item, mas as etapas ENTENDER (anotações/perguntas) e as notas por aula não têm tela dedicada além das observações das sessões.

## 8. Mapa de arquivos principais

- `docs/ANALISE.md` — extração dos prints, IDs, duplicidades, cargas.
- `docs/CRONOGRAMA.md` — cronograma original dia a dia.
- `data/catalog.json`, `data/lab.json` — fontes dos dados.
- `backend/app/planner.py` — algoritmo de distribuição (função pura).
- `backend/app/tracker.py` — progresso, revisões e recálculo adaptativo.
- `backend/app/catalog.py` — validação/importação e bruto × único.
- `backend/app/gamification.py`, `lab.py`, `backup.py`, `services.py`, `main.py`.
- `frontend/` — PWA (manifest, `sw.js`, views).
- `tests/` — suíte pytest.

## 9. Recomendações para a auditoria

1. Conferir a tabela da seção 2 contra os 20 prints (títulos e durações).
2. Validar ou corrigir o agrupamento em trilhas e a reserva de 32h18.
3. Rodar os `.bat` num Windows real.
4. Rodar Lighthouse (PWA/acessibilidade) numa instância real.
5. Revisar as razões de prática e a capacidade diária para a sua realidade.
