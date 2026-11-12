# Resumo geral — AI Engineer Study Tracker

Branch `ccr-97dc7c3e-vbe1hb` · pasta `ai-study-tracker/` · 57 testes passando

## 1. O que existe (PWA local-first)
- **Stack:** FastAPI + SQLite + HTML/CSS/JS sem build; fontes e ícones locais, 0 requisições externas.
- **Telas:** Painel, Calendário (mês/agenda), Formação (cursos, trilhas, auditoria), Sessões, Focus Mode (timer com pausa), AI Agent Lab (9 estágios com tarefas, milestones e notas), Competências, Conquistas/XP/níveis, Planejamento, Ajustes.
- **Cronograma adaptativo:** recalcula só o futuro; o histórico e a "foto" do plano de cada dia são preservados.
- **Revisão espaçada** D+1/D+7/D+30, curta, com contador "Reviews de hoje".
- **XP:** fazer vale mais que assistir (vídeo 1×, revisão 1,5×, prática 2×, projeto 2,5×); 6 níveis; 19 conquistas.
- **Dados:** backup/restore (.db), export/import (JSON), backup de segurança antes de restaurar/importar.
- **PWA:** manifest, service worker, ícone, splash, offline com últimos dados. Chrome (CDP): 0 erros de instalabilidade.
- **Windows:** `install.bat`, `start.bat`, `backup.bat`, `restore.bat`. Modo LAN com aviso explícito.

## 2. Auditoria do catálogo (fase 1)
Removido: reserva de 32h18, 91 blocos sintéticos e trilhas T1–T6 inferidas. Agora só entra o que está nos prints.

| Carga | Valor |
|---|---|
| Declarada | 62h34 |
| Identificada nos prints | 30h16 (18 aparições, 17 cursos) |
| Duplicada | 0h26 (Masterclass Claude Code, 2x, conta 1x) |
| Conteúdo único identificado | 29h50 |
| **Não identificado** | **32h18** [NÃO IDENTIFICADO], não agendado (32h44 se a declarada somar só conteúdo único) [VERIFICAR] |

- 8 trilhas: todas "A confirmar" (sem nome, sem cursos associados). Cada curso: `Trilha: [VERIFICAR]`.
- Status dos dados: CONFIRMADO (título, duração, posição, instrutor truncado) · INFERIDO (agrupamento dos cards, ordem de estudo) · NÃO IDENTIFICADO (aulas/módulos, trilhas) · ESTIMATIVA DO SISTEMA (prática, pontos de partida, horas do Lab).

## 3. Cronograma (fase 2) — só conteúdo identificado
```
FORMAÇÃO 29h50 · PRÁTICA 14h00 · PROJETOS 34h30 · REVISÃO 6h04
TEMPO TOTAL DE APRENDIZADO 84h24
13/11/2026 → 28/12/2026 · 38 dias de estudo · 8 de descanso · média 2h13 · maior dia 3h38
Rotina: Seg/Ter/Qui 2h15 · Qua 2h · Sex 1h45 · Sáb 3h30 (Lab) · Dom descanso
```
Hipótese (não dado): se os 32h18 restantes fossem cursos de agentes, o fim iria para ~25–27/01/2027.

## 4. Design (fase 3)
Dark + verde esmeralda (tokens `--bg-primary`, `--green-primary`, `--green-glow` etc.). axe-core: 0 violações em 11 telas, desktop e mobile. Performance (CPU 4x + 4G lento): primeira renderização ~1 s, 165 KB, heap 10 MB.

## 5. Qualidade
57 testes: planner, catálogo/duplicidades/confiança, cargas, API, adaptação, sessões, XP, revisão, backup/restore, PWA e checagem estática dos `.bat`. Bug real achado e corrigido: restore de banco corrompido retornava 500.

## 6. Não validado
- `.bat` só com checagem estática; **nunca executados em Windows real**.
- PWA só em emulação; sem teste em Android real e sem Lighthouse.
- Sem testes automatizados de UI (validação por screenshots e axe).
- Telas ainda sem screenshots na nova identidade: Focus, Lab, competências, gamificação, estados vazios, reviews.

## 7. Pendências
Aguardando sua avaliação do visual (fase 3). Depois: fases 4–7 (refino de tracking/Lab/gamificação, PWA em dispositivo, screenshots restantes). Para fechar o catálogo, faltam prints com: nomes e cursos das trilhas, cards abertos em "Ver X aulas" e as trilhas 7–8.

## 8. Documentos
`README.md` · `docs/ANALISE.md` · `docs/CRONOGRAMA.md` · `docs/AUDITORIA.md` (histórico v1) · `docs/screenshots/`
