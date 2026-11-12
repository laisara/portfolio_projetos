# Análise do catálogo

Fonte: player da plataforma (lista de aulas com duração individual), enviada em 12/11/2026 por prints, vídeos e fotos.
Gerado por `scripts/build_catalog.py`, que imprime a conferência soma das aulas × card de cada curso.

## Estrutura confirmada
8 trilhas em 2 grupos. Os cursos de cada trilha e a ordem vêm do próprio player ("Curso N de M").

| Grupo | Trilha | Cursos | Soma das aulas | Cabeçalho do site |
|---|---|---|---|---|
| Produtividade pessoal com IA | 1. Dominando o ecossistema Claude | 5 | 6h53 | 6h50 |
| | 2. Dominando Openclaw | 4 | 5h25 | 5h24 |
| | 3. Criando Agentes Pessoais com Hermes Agent | 3 | 3h36 | 3h35 |
| | 4. Agentes com GPT | 3 | 2h23 | 2h23 |
| Criando sistemas profissionais de IA | 5. Aplicações Inteligentes com IA | 7 | 9h47 | 9h47 |
| | 6. Ferramentas de AI para Desenvolvedores | 6 | 8h52 | 8h51 |
| | 7. Criando agentes de atendimento no N8N | 8 | 10h15 | 10h15 |
| | 8. Aplicações AI com Python | 12 | 27h20 | 26h51 |

Todas as trilhas batem com o cabeçalho em até 1 minuto, **exceto a 8** (+29 min). Os cards de cada curso dessa trilha
batem com a soma das aulas (≤ 1 min cada), então a diferença está no cabeçalho do site. Fica como informativo.

## Números
- 42 cursos únicos · 463 aulas (1 é um aviso "em breve", que não é aula).
- Carga bruta 74h30m39s · duplicado 8h09m02s · **único 66h21m37s**. Declarado pela plataforma: 62h34 (+3h47).
- 56 aulas sem duração no player (quizzes, testes, guias): exibidas como "-", contam 0 min.
- Duplicados: *Fundamentos da IA Generativa* (6 trilhas), *Masterclass Claude Code* (2).

## Fora do programa (decisão da usuária)
Projetos para Professores · Para se aprofundar.

## Opcional (cadastrado, fora dos totais)
*Git e GitHub – Controle de Versão e Colaboração* (`GIT-001`, eletivo Webapps): 20 aulas, 3h08m34s (card 3h08), 6 aulas sem duração. Fica fora do progresso geral,
das trilhas, do cronograma e das cargas bruta/única; o progresso próprio, o XP das aulas e as revisões continuam funcionando. Não conta como "curso concluído" para conquistas.

## Marcado para conferência (leitura por foto, zero riscado)
- *Conectando MCPs* (Antigravity): 0:01 adotado; poderia ser 8:01 (só 0:01 fecha com o card).
- *Conceitos Gerais de LLMs* (19:03), *Os princípios de um bom prompt* (10:03), *Transformando, traduzindo e modificando* (6:40).
- Aula 6 de *Hermes Agent* (30:50), aulas 8 e 20 de *Claude Desktop*, aulas 3/5/8 de *Claude Avançado*, aulas 11/15 do curso de WhatsApp.
- Posição dos guias de instalação dentro do *Coder Toolbox* e ordem das aulas 10/11 do *Antigravity*.
O erro máximo é de segundos por aula; cada curso fecha com o card em até 2 minutos.

## Estimativas do sistema (não vêm da plataforma)
Classificação de competências por curso, pontos de partida das competências (editáveis), capacidade diária e
percentuais da revisão espaçada.

## Auditoria das durações (12/11/2026) — `scripts/audit_durations.py` + `tests/test_durations.py`
Verificação independente, repetível e agora permanente nos testes:
1. **Soma das aulas × card:** o card do site **trunca para minutos**. Nos 42 cursos, `floor(soma das aulas) == card`, sem exceção
   (ex.: Hermes Agent 1:59:55 → card 119 min; arredondar daria 120). Isso valida cada leitura ao minuto.
2. **Contagem de aulas:** os 42 cursos têm exatamente as aulas anunciadas; numeração 1..N contínua; IDs únicos.
3. **Leituras incertas (zero riscado 0↔8):** o erro de cada curso fica dentro de [card, card+1 min). Logo, o total único está
   entre 66:03:00 e 66:45:00, e o valor adotado (66:21:37) está dentro desse intervalo. Onde duas leituras fecham com o card,
   foi mantida a leitura original; onde só uma fecha, ela é a correta (ex.: *Conectando MCPs* = 0:01, pois 8:01 daria 2:24:50 ≠ 2:16 do card;
   Hermes aula 6 = 30:50, pois 30:58 daria 2:00:03 ≠ 1:59).
4. **Trilhas × cabeçalho:** nas trilhas 2 a 7 o cabeçalho também é o truncamento exato da soma das aulas. As trilhas 1 (−3 min) e 8 (−29 min)
   divergem; cada curso dessas trilhas confere com o card. Hipótese (não confirmada): o cabeçalho ficou desatualizado, pois os cursos
   marcados "AULAS NOVAS"/"NOVO" (Claude Desktop, Claude Avançado e os projetos da trilha 8) cresceram depois.
5. **Plano × catálogo:** o cronograma agenda as 462 aulas obrigatórias, cada uma uma vez, somando exatamente 66h21m37s.
6. **Banco × catálogo:** importação real confere ao segundo (único 66:21:37, bruto 74:30:39, duplicado 8:09:02).
Nenhum erro de dados foi encontrado; nenhuma duração precisou ser alterada. (Na fase de coleta, um erro meu de soma no
*Dominando Automações com n8n* já havia sido corrigido: 2h47m26s.)
