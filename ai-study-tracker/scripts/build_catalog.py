"""Gera data/catalog.json a partir dos dados transcritos dos prints/vídeos/fotos da plataforma.

Fonte: player da formação (lista de aulas com duração individual), enviada em 12/11/2026.
Regras:
- Duração oficial de um curso = SOMA das durações das aulas (decisão da usuária).
- Aula sem duração no player = "-" (conta 0 min). Quizzes/testes têm kind "quiz".
- Módulo sem título no player = "Módulo N".
- Eletivos (Projetos para Professores, Para se aprofundar, Git e GitHub) ficam FORA.
- Cada curso é cadastrado UMA vez; trilhas apontam para ele (progresso compartilhado).

Uso: python scripts/build_catalog.py   (imprime a conferência soma × card)
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "catalog.json"


def dur(s: str):
    if s == "-":
        return None
    p = [int(x) for x in s.split(":")]
    return p[0] * 60 + p[1] if len(p) == 2 else p[0] * 3600 + p[1] * 60 + p[2]


def parse_module(title: str, block: str):
    lessons = []
    for line in block.strip().splitlines():
        n, t, d = line.split("|")
        sec = dur(d.strip())
        if sec is None:
            tl = t.lower()
            kind = "placeholder" if "ainda está em produção" in tl else ("quiz" if tl.startswith(("quiz", "teste")) else "other")
        else:
            kind = "video"
        lessons.append({"n": int(n), "title": t.strip(), "seconds": sec, "kind": kind})
    return {"title": title, "lessons": lessons}


# competências (classificação do SISTEMA, editável): fundamentals, prompt, apis, python, aicoding, tools, agents, rag, multiagent, systems
C = {}


def course(cid, title, card_min, type_, comp, modules, note=None):
    C[cid] = {"title": title, "type": type_, "card_min": card_min, "competencies": comp, "note": note,
              "modules": [parse_module(t, b) for t, b in modules]}


# ------------------------------------------------------------------ GRUPO 1 — Produtividade pessoal com IA
course("START-CLAUDE", "Comece por aqui - Dominando o ecossistema Claude", 1, "curso", [], [("Curso completo", "1|Comece por aqui – Dominando o Ecossistema do Claude|1:24")])
course("GENAI-001", "Fundamentos da IA Generativa", 92, "curso", ["fundamentals", "prompt"], [("Módulo 1 (Curso completo)", """
1|Apresentação|2:08
2|Um pouco de história|20:32
3|Entendendo a lógica das LLMs|11:33
4|Engenharia de Prompts|11:45
5|Explorando diferentes modelos|9:43
6|Conectando ferramentas|8:16
7|Janela de contexto|4:27
8|Alucinação (e como evitá-las?)|9:48
9|Skills, MCPs e nosso primeiro agente|14:20""")])
course("CLAUDE-001", "Claude Desktop", 176, "curso", ["prompt", "aicoding"], [
    ("Instalação e Configuração", """
1|Introdução – Claude Desktop|2:21
2|Instalação Claude Desktop – Windows|2:15
3|Instalação Claude Desktop – MacOS|1:24
4|Interface do Claude Desktop|12:54"""),
    ("Modo Chat - Uso Completo", """
5|Utilizações práticas do Claude Desktop|14:03
6|Criando conexões externas com Claude Desktop|11:49
7|Manipulando imagens com Claude Desktop|3:46
8|Criando prompts mais produtivos|7:30
9|Avaliador de Currículos – Criando uma skill|5:31
10|Como trabalhar com projetos no Claude Desktop|3:52"""),
    ("Dominando o Claude Cowork", """
11|O que é o Claude Cowork?|6:57
12|Definindo pasta de trabalho no Claude Cowork|4:04
13|Criando um projeto no Claude Cowork|4:36
14|Criando uma skill no Claude Cowork|9:04
15|Conectando o Claude Cowork com ferramentas externas|5:47
16|Realizando agendamentos no Claude Cowork|6:08
17|Criando uma skill e agendamento no Claude Cowork|9:11
18|Criando um assistente de RH no Claude Cowork|7:02"""),
    ("Claude nas Profissões", """
19|O desafio do professor em suas tarefas|10:43
20|Usando o Claude como apoio pedagógico|13:30
21|Criando formulários com Claude|3:08
22|Feedback automatizado|5:21
23|Criando animações com Remotion|5:37
24|O desafio do nutricionista em suas tarefas|3:45
25|O uso responsável do Claude na Nutrição|2:36
26|O desafio do profissional de RH|3:24
27|O uso responsável do Claude no recrutamento|3:24
28|Ranqueamento de currículos|6:56""")],
    note="Aula 8 (7:30): leitura com zero riscado [VERIFICAR]; aula 20 (13:30) idem.")
course("CODE-001", "Masterclass Claude Code", 26, "curso", ["aicoding"], [("Assista a Masterclass Claude Code", "1|Masterclass Claude Code|26:22")])
course("CLAUDE-002", "Claude Avançado: Skills, Conectores, Artefatos e SubAgents", 116, "curso", ["tools", "multiagent", "apis"], [("Curso Completo", """
1|Anatomia de uma Skill|16:48
2|Criando sua Primeira Skill|18:14
3|A Description e o Gatilho de Acionamento|15:00
4|Skills com Templates e Arquivos de Apoio|15:41
5|Empacotamento e Distribuição de Skills|10:49
6|Claude na Prática: Visão Geral dos Recursos|8:58
7|Artefatos Interativos|5:11
8|Projetos: Contexto e Instruções Persistentes|3:40
9|Instalação e Uso de Extensões|4:13
10|Conectores: Integrando o Claude a Ferramentas Externas|3:44
11|Tarefas Agendadas e Automação de Rotinas|5:12
12|Instalação e Uso de Plugins|3:19
13|Projeto Multiagentes: Orquestração de Agentes Especializados|5:18""")],
    note="Aulas 3, 5 e 8: zero riscado [VERIFICAR].")
course("START-OPENCLAW", "Comece por aqui - Trilha Dominando OpenClaw", 5, "curso", [], [("Curso completo", """
1|Comece por aqui – Trilha Dominando OpenClaw|3:07
2|Como a trilha está estruturada – Trilha Dominando OpenClaw|2:12""")])
course("OPENCLAW-001", "Dominando o OpenClaw", 134, "curso", ["agents", "multiagent", "tools"], [("Curso completo", """
1|Introdução – Dominando o OpenClaw|3:20
2|Introdução ao OpenClaw|12:17
3|Instalação do OpenClaw|18:28
4|Como OpenClaw funciona|26:38
5|Workspace em profundidade|25:03
6|Canais|31:04
7|Tools, skills e automações|15:07
8|Conclusão|2:21""")])
course("OPENCLAW-002", "Criando um assistente pessoal com OpenClaw", 92, "projeto", ["agents", "systems"], [("Projeto completo", """
1|Criando nosso assistente pessoal|5:21
2|Configurando o Discord|16:05
3|O primeiro projeto – Morning Brief|11:44
4|MCPs (Gmail, Agenda e outros)|9:47
5|Gestão de custos e OpenRouter|10:14
6|Como eu escolho modelos de AI|9:00
7|Mission Control (criando um Dashboard Pessoal)|6:33
8|Um agente ou múltiplos agentes|5:42
9|ClawHub|3:39
10|Segurança|14:16""")])
course("START-HERMES", "Comece por aqui - Criando Agentes Pessoais com Hermes Agent", 3, "curso", [], [("Curso completo", "1|Comece por aqui – Criando Agentes Pessoais com Hermes Agent|3:13")])
course("HERMES-001", "Hermes Agent", 119, "curso", ["agents", "tools"], [("Módulo 1", """
1|Introdução: seja bem-vindo|2:57
2|Entendendo a estrutura do Hermes Agent|11:06
3|Instalando e configurando o seu agente|31:33
4|Conversando com o Hermes em diferentes canais|21:38
5|Skills e Cron: ensinando o Hermes a agir|14:20
6|MCPs: conectando o Hermes ao mundo|30:50
7|Finalização: boas práticas|7:31""")], note="Módulo sem título no player. Aula 6 (30:50) e aula 2 (11:06): zero riscado [VERIFICAR].")
course("START-GPT", "Comece por aqui - Agentes com GPT", 3, "curso", [], [("Curso completo", "1|Comece por aqui – Agentes com GPT|3:19")])
course("GPT-001", "Criando agentes com GPT", 47, "curso", ["agents", "prompt"], [("Curso Completo", """
1|Conhecendo os GPTs|6:23
2|Criando nosso primeiro Agente|10:16
3|Engenharia de Prompt (e nosso segundo Agente)|22:01
4|Criando prompts usando outras IAs (e nosso terceiro Agente)|8:36
5|Indo além: engenharia de prompts|-""")])

# ------------------------------------------------------------------ GRUPO 2 — Criando sistemas profissionais de IA
course("START-APPS", "Comece por aqui - Trilha Aplicações Inteligentes com IA", 6, "curso", [], [("Curso completo", """
1|Apresentação – Trilha Aplicações Inteligentes com IA|1:27
2|O que é a Trilha Aplicações Inteligentes com IA?|2:38
3|Como a Trilha Aplicações Inteligentes com IA está organizada?|2:28""")])
course("PY-001", "Pensando como um Programador (usando Python e IA)", 136, "curso", ["python", "aicoding"], [
    ("Pensando como um Programador (usando Python e IA)", """
1|Uma nova abordagem para aprender programação|3:20
2|Como este curso está estruturado|5:18"""),
    ("Aprendendo os elementos da programação através do Python", """
3|Variáveis|9:18
4|Quiz – Variáveis|-
5|Operadores|9:53
6|Quiz Operadores|-
7|If Else|7:34
8|Quiz if/else|-
9|Listas|8:37
10|Quiz Listas|-
11|Dicionários (JSON)|5:36
12|Quiz Dicionários (JSON)|-
13|For Loops|14:29
14|Quiz for Loops|-
15|While|3:35
16|Quiz while|-
17|Funções|12:48
18|Quiz Funções|-
19|Programação Orientada a Objetos|16:22
20|Quiz Programação Orientada a Objetos|-
21|Teste Final|-"""),
    ("Primeiros projetos usando IA", """
22|Primeiros projetos usando IA|1:55
23|O primeiro projeto com AI – Números primos|14:49
24|Trabalhando com bibliotecas|13:16
25|Acessando e modificando arquivos por nós|8:48
26|E os próximos passos?|1:07""")])
course("PY-002", "Coder Toolbox - Conceitos essenciais para programar com IA", 157, "curso", ["python", "apis", "aicoding"], [
    ("Preparando sua máquina para programar com IA", """
1|Apresentação do Curso|4:05
2|Setup inicial do Cursor e rodando nosso primeiro script|13:22
3|Guia de Instalação – Python|-
4|Guia de Instalação – Cursor|-
5|Bibliotecas e Ambientes virtuais|14:05
6|Gerenciamento de erros (stack trace e erros invisíveis)|22:01
7|Versionamento de projetos com Git|20:37
8|Guia de Instalação – Git|-
9|APIs (conectando nosso app com o mundo)|13:24"""),
    ("Criando seu próprio ChatGPT", """
10|Apresentação do módulo|1:02
11|Configurando o Cursor com OpenRouter|7:38
12|Adicionando inteligência ao nosso App|8:12
13|Criando nossa primeira API (backend)|10:44
14|Criando o Frontend|11:56
15|Banco de dados e autenticação|10:42
16|Deploy (compartilhando nosso projeto com o mundo)|19:26""")],
    note="Posição dos guias de instalação entre as aulas: ordem lida na primeira rodada [VERIFICAR].")
course("UI-001", "Masterclass - Criando Interfaces Absurdas com IA", 25, "curso", ["systems", "aicoding"], [("Curso completo", """
1|Masterclass – Criando Interfaces Absurdas com IA|25:32
2|Guia de Instalação – Antigravity|-""")])
course("LANG-001", "Criando Sistemas Agenticos com Langchain", 111, "curso", ["agents", "tools", "python"], [
    ("Módulo 1", """
1|Apresentação|2:20
2|Agente Modelo + Harness|9:06
3|Primeiros passos trabalhando com LLMs|18:01
4|Adicionando memória na LLM|4:27
5|Como fazer a LLM usar ferramentas|11:43
6|O System Prompt|4:02
7|Usar ou não frameworks de AI? Porque Langchain?|11:17
8|Custo dos modelos|6:42"""),
    ("Módulo 2", """
9|Trabalhando com Modelos|11:57
10|Mensagens e Ferramentas|9:25
11|Implementando nosso primeiro agente com ReAct|12:45
12|A Classe Agent|10:01""")], note="Módulos sem título no player. Aula 1 (2:20): zero riscado [VERIFICAR].")
course("LANG-002", "Langclean - Um agente de limpeza do computador", 57, "projeto", ["agents", "systems"], [("Projeto completo", """
1|Apresentação|2:29
2|O processo de construção que eu utilizei|9:23
3|Criando mocks da tela|15:51
4|Criando o frontend do nosso app|9:20
5|Desenvolvendo o agente no backend|6:04
6|Integrando o agente ao frontend|13:57""")])
course("START-TOOLS", "Comece por aqui - Ferramentas de AI para Desenvolvedores", 1, "curso", [], [("Curso completo", "1|Comece por aqui – Ferramentas com AI para desenvolvedores|1:12")])
course("IDE-001", "Dominando o Antigravity", 136, "curso", ["aicoding", "systems"], [
    ("Primeiros passos com Antigravity", """
1|Abertura|0:48
2|Como o AntiGravity funciona?|7:53
3|Instalando o AntiGravity|11:21
4|Tour pelo AntiGravity|10:23
5|Errata: Instalação|3:21"""),
    ("Conceitos fundamentais do Antigravity", """
6|Plan Mode|14:20
7|Errata: Plan Mode|2:58
8|Rules|10:19
9|Workflows|6:00
10|Nova Localização das Skills no Antigravity IDE|-
11|Skills|13:02"""),
    ("Expandindo o Antigravity com Node", """
12|Instalando o Node.JS|7:04
13|Site com React|7:48
14|Conectando MCPs|0:01"""),
    ("Antigravity IDE e 2.0", """
15|Mudanças no Antigravity IDE|10:19
16|Apresentando o Antigravity 2.0|19:37
17|Mudanças e novas funcionalidades|11:36""")],
    note="Aula 14 (Conectando MCPs): leitura 0:01 ou 8:01 [VERIFICAR]; adotado 0:01 porque só assim a soma fecha com o card. Ordem das aulas 10/11 [VERIFICAR].")
course("IDE-002", "Cursor 3 - Desenvolvimento Assistido por IA", 111, "curso", ["aicoding"], [
    ("Conceitos básicos do Cursor 3", """
1|Introdução|3:11
2|Conhecendo o Cursor e conversando com a IA|9:00
3|Colocando o Agent para trabalhar|8:37
4|Desenvolvendo uma aplicação estática com IA|16:00"""),
    ("Subagents do Cursor 3", """
5|Subagents – Entendendo o Básico|7:40
6|Múltiplos Subagents|14:55
7|Agente Coordenador de Projeto|13:16"""),
    ("Criando Skills para especializar agentes", """
8|Criando Skills para Especializar Agentes|15:36
9|Criando uma Rule para Projetos Python|8:58
10|MCP com Context7|14:39""")])
course("IDE-003", "CursorAI - ganhe 10x mais produtividade com a IDE de IA", 93, "curso", ["aicoding"], [
    ("Introdução ao curso", """
1|O que é o Cursor AI?|5:55
2|Por que aprender a usar o Cursor AI?|6:13"""),
    ("Instalação e configuração", """
3|Instalando e Configurando o Cursor AI|12:46
4|Configuração Inicial e Ambiente de Uso|9:28"""),
    ("Interface e funcionalidades", """
5|Explorando a Interface e Funcionalidades|9:56
6|Diferenciais e Recursos Avançados|-"""),
    ("Introdução a MCPs", """
7|Introdução aos Modelos MCP|6:52
8|MCPs: Origem, Conceito e Aplicações no Cursor AI|-"""),
    ("Integração de MCP", """
9|Integração com MCPs|18:11
10|Casos de Uso e Dicas de Aplicação|13:38
11|Convertendo Linguagem com MCP|10:10""")], note="Tema sobreposto ao Cursor 3. Aula 11 (10:10): zero riscado [VERIFICAR].")
course("CODE-002", "Claude Code na prática: evoluindo um projeto com IA", 162, "curso", ["aicoding", "systems"], [
    ("Iniciando no Claude Code", """
1|Introdução – Claude Code|1:25
2|Instalação do Claude Code – Terminal, VSCode e Cursor|6:08
3|Claude Code no Terminal e Repositório GIT Local|11:51
4|O que é um BFF?|5:31
5|Contexto com Claude.md|9:11
6|Gerenciando tamanho do Contexto|13:16
7|Permissões no Claude Code|21:54"""),
    ("Claude Code intermediário", """
8|Comandos Personalizados|8:16
9|Gerando Testes Unitários com Slash-Commands|25:06
10|Claude Code Skill – Parte 1|10:14
11|Claude Code Skill – Parte 2|29:07
12|Claude Code Hooks|20:08"""),
    ("Boas práticas com Claude Code (EM BREVE)", "13|Esse curso ainda está em produção|-")],
    note="Módulo 3 é um aviso de conteúdo futuro (não é aula): não conta para concluir o curso.")
course("START-N8N", "Comece aqui - Nível intermediário Engenheiros de Agentes de IA", 1, "curso", [], [("Curso completo", "1|Assista essa aula antes de começar o nível intermediário|1:46")])
course("N8N-001", "Dominando Automações com n8n", 167, "curso", ["apis", "tools"], [
    ("Onboarding - Introdução ao N8N", """
1|Sejam Bem-Vindos: O Que Você Vai Aprender|2:39
2|Por Que o N8N Se Tornou Tão Popular?|4:53
3|O Que Eu Serei Capaz de Construir?|6:27"""),
    ("Fundamentos do N8N na Prática", """
4|O Que Vamos Construir Juntos|3:09
5|Preparando o Ambiente|3:45
6|Triggers: Como Tudo Começa|12:29
7|Quiz 1|-
8|Fluxo e Processamento dos Dados|24:48
9|Entendendo sobre Controles de Fluxo|12:04
10|Integrando N8N com o Google Sheets|12:16
11|Quiz 2|-
12|Aula de Encerramento|2:01
13|Teste final|-"""),
    ("O Modelo de Dados do N8N", """
14|Introdução: O que você vai dominar nesse módulo|2:29
15|O objeto de dados: Criando dados, lendo, entendendo e moldando|11:42
16|Listas e itens: quebrando e juntando dados|9:51
17|Editando listas sem código: Filter, Sort e Limit|15:12
18|Ramificando e juntando o fluxo com Merge|8:04"""),
    ("Expressões e Dados", """
19|Introdução: o que você vai dominar nesse módulo|1:48
20|O que é uma expression|6:19
21|Transformando texto|8:56
22|Formatando datas e números|5:45
23|Condicionais e fallbacks e finalização|12:49""")])
course("N8N-002", "N8N Open-Source: Use a ferramenta de forma gratuita", 48, "curso", ["tools"], [("Curso completo", """
1|Boas-vindas e visão geral|1:41
2|n8n.cloud vs Self-Hosting|13:33
3|Instalação rápida e seu primeiro fluxo|14:02
4|Hospedando o n8n na Hostinger VPS|18:06
5|Conclusão|1:14""")])
course("N8N-003", "Banco de Integrações com n8n", 47, "curso", ["apis", "tools"], [
    ("Apresentação", "1|O que você vai ver neste curso|1:37"),
    ("Integrações na prática", """
2|Gmail, Google Agenda, Drive, Google Sheets e Docs|7:05
3|Telegram|3:32
4|OpenAI|6:21
5|Z-API|5:39
6|Groq|5:31
7|ElevenLabs|5:48
8|Fal.ai|12:08
9|Quiz – Banco de Integrações|-""")])
course("N8N-004", "Criando agentes de atendimento profissionais no Whatsapp", 149, "curso", ["agents", "rag", "apis", "systems"], [
    ("Introdução", """
1|Introdução à Trilha|0:56
2|Tech Stack da Trilha|3:07
3|Instalação da Infraestrutura na Railway|3:12
4|Pré-requisitos da API Oficial do WhatsApp|6:25"""),
    ("Configurando API Oficial do WhatsApp", """
5|Criando o Aplicativo na Meta|8:42
6|Configurando e Registrando Número Virtual na Meta|2:50
7|Ativando Webhook da Meta no n8n|9:38
8|Conectando Número com API Oficial do WhatsApp no n8n|7:57
9|Criando a tabela de memória do agente no Supabase (n8n_chat_histories)|-
10|Quiz – Configurando a API Oficial do WhatsApp|-"""),
    ("Desenvolvimento do Agente de IA", """
11|Criando e Conectando Bancos de Dados e OpenAI no n8n|40:17
12|Criando Fluxo e Estrutura do Prompt do Agente de IA|15:29
13|Escrevendo Prompt do Agente de IA|6:10
14|Criando Ferramentas do Agente de IA|14:19
15|Finalizando Tools e Pipeline RAG|29:09
16|Finalização|1:14
17|Quiz – Desenvolvimento do Agente de IA|-""")],
    note="Aulas 11 (40:17) e 15 (29:09): zero riscado [VERIFICAR].")
course("N8N-005", "IA de Agendamento no Google Agenda", 65, "projeto", ["agents", "apis", "systems"], [("Projeto completo", """
1|Boas Vindas e Apresentação|5:23
2|Construindo o Agente de IA e Conectando com Google Calendar|29:07
3|Conectando o Agente ao WhatsApp|15:34
4|Criando Funcionalidade de Notificação via WhatsApp|15:48""")])
course("N8N-006", "UGC Factory - Crie um fluxo para produzir vídeos UGC", 40, "projeto", ["agents", "systems"], [("Projeto completo", """
1|Introdução|3:07
2|Conhecendo o projeto|5:30
3|Construindo o agente de imagem|21:32
4|Construindo o agente de vídeo|9:02
5|Finalização|1:05""")])
course("N8N-007", "Consumindo API's com n8n", 94, "curso", ["apis", "tools"], [("APIs no n8n", """
1|Abertura|1:11
2|Conhecendo as apis no n8n|24:27
3|Autenticação|19:44
4|Paginação|16:21
5|Rate limit e tratamento de erros|16:16
6|Webhooks|13:09
7|Fechamento|3:00""")])
course("START-PYTHON", "Comece por aqui - Aplicações AI com Python", 6, "curso", [], [("Curso completo", """
1|Apresentação da Trilha – Aplicações AI com Python|3:09
2|Como esta trilha está organizada – Aplicações IA com Python|3:06""")])
course("LLM-001", "Por dentro das LLMs - como funcionam modelos como o ChatGPT?", 78, "curso", ["fundamentals"], [
    ("Conhecendo as LLMs", """
1|O que você vai aprender neste curso?|3:11
2|Transformers e LLMs|2:49"""),
    ("Como treinar uma LLM?", """
3|Primeira etapa – Processar toda a internet|5:13
4|Segunda etapa – Tokenização|6:46
5|Terceira etapa – Realizando o pretraining|11:00
6|As propriedades de um modelo BASE|9:45
7|Quarta etapa – O Supervised Fine-Tuning|8:50
8|Quiz 1|-"""),
    ("Aprimorando uma LLM", """
9|Lidando com Alucinações e usando Ferramentas|12:04
10|Modelos precisam de tokens para pensar|5:05
11|Quiz 2|-"""),
    ("Aprendizado por reforço", """
12|Quinta etapa – Reinforcement Learning|6:21
13|DeepSeek, AI Leaderboard e fechamento|7:27
14|Teste final|-""")])
course("LOGIC-001", "Introdução à Lógica de Programação", 51, "curso", ["python"], [
    ("Apresentação do curso", """
1|Boas-vindas|1:11
2|Asimov Academy: nossos princípios|2:25
3|O que é uma linguagem de programação|2:25
4|O que podemos e não podemos fazer com Python|2:27
5|Como tirar suas dúvidas?|3:38"""),
    ("Lógica de programação", """
6|Apresentação à lógica de programação|2:20
7|O Conceito de Algoritmo|7:10
8|Exemplos práticos de algoritmos|8:40
9|Estrutura dos algoritmos|2:10
10|Elementos básicos da programação|2:53
11|Quiz – Algoritmos|-"""),
    ("Variáveis, operadores e estruturas", """
12|Variáveis|5:20
13|Operadores|4:42
14|Estruturas de controle de fluxo|2:46
15|Estruturas de repetição|3:13
16|Quiz – Variáveis, operadores e estruturas|-"""),
    ("Teste final", "17|Teste final – Lógica de programação|-")])
course("PYTHON-001", "Aprendendo Python: Conceitos Básicos", 372, "curso", ["python"], [
    ("Fundamentos de Python", """
1|Como vamos aprender Python?|4:53
2|Criando nosso primeiro script|11:56
3|Números em Python|7:52
4|Texto em Python|11:44
5|Variáveis|10:14
6|Pegando valores do usuário|6:44
7|Desafio – entrevista|10:11
8|Formatação de texto|9:41
9|Quiz – Fundamentos do Python|-"""),
    ("Controle de fluxo", """
10|Controle de fluxo|10:35
11|Operadores de comparação|12:24
12|Operadores booleanos|7:44
13|Desafio – usuário e senha|10:25
14|Desafio – acerte o número|7:43
15|Quiz – Controle de fluxo|-"""),
    ("Sequências e loops", """
16|Listas|6:02
17|Tuplas e dados mutáveis|5:29
18|Sequências|7:32
19|Slicing|8:13
20|A função range|5:28
21|For loops|7:58
22|Iterando sobre sequências|10:49
23|While loops|5:08
24|Break e continue|11:05
25|Desafio – iteração|8:05
26|Desafio – iteração com múltiplas listas|10:13
27|Quiz – Sequências e loops|-"""),
    ("Dicionários e métodos", """
28|Dicionários|9:06
29|O operador in|6:00
30|Métodos em Python|6:01
31|Métodos de dicionários|7:57
32|Métodos de strings e números|14:35
33|Métodos de listas e tuplas|11:03
34|Desafio – contador de caracteres|6:31
35|Desafio – jogo dos estados|13:14
36|Aula extra – Compreensão de lista|6:39
37|Quiz – Dicionários e métodos|-"""),
    ("Funções e importação", """
38|Funções|8:24
39|Parâmetros e argumentos|8:26
40|O valor None|9:02
41|Importação de módulos|8:29
42|A biblioteca padrão de Python|11:52
43|Quiz – Funções e importação|-"""),
    ("Desafios finais", """
44|Desafio – cifra de César|14:33
45|Desafio – baralho de cartas|19:45
46|Teste final – Python Básico|-
47|Para onde seguir?|2:58""")])
course("SETUP-001", "Criando seu Setup para Programação Python", 161, "curso", ["python", "aicoding"], [
    ("Introdução ao curso", """
1|O que você vai aprender|5:13
2|O que é um terminal|6:58
3|Quiz – Terminal|-"""),
    ("Instalando Python em todos os sistemas operacionais", """
4|O terminal do Windows|8:19
5|Instalando Python no Windows|9:10
6|O terminal do Mac|5:35
7|Instalando Python no Mac|7:08
8|O terminal do Linux|4:30
9|Instalando Python no Linux|12:16
10|Outras opções de instalação|9:43
11|Quiz – Instalação do Python|-"""),
    ("Entendendo e configurando IDEs", """
12|O que são IDEs|4:58
13|Instalando e configurando o VS Code|9:47
14|Instalando e configurando o Pycharm|10:46
15|O console de iPython|5:22
16|Jupyter Notebook e Jupyter Lab|11:05
17|Outras opções de IDEs|6:53
18|Quiz – Entendendo e configurando IDEs|-"""),
    ("Ambientes virtuais", """
19|O que é um ambiente virtual|4:39
20|Criando e ativando seu ambiente virtual|10:26
21|Selecionando o interpretador de Python nas IDEs|6:03
22|Quiz – Ambientes virtuais|-"""),
    ("Estruturando seu projeto", """
23|Importando arquivos com código – a variável __name__|6:56
24|Estrutura do projeto e erros de importação|15:40
25|Teste final – Criando seu setup para programação Python|-""")])
course("PROMPT-001", "Engenharia de Prompts", 129, "curso", ["prompt"], [
    ("Introdução", """
1|Apresentação ao curso de Engenharia de Prompt|4:54
2|Conceitos Gerais de LLMs|19:03
3|Atualização importante: o Playground da OpenAI mudou|-
4|Os princípios de um bom prompt|10:03"""),
    ("Clareza e especificidade", """
5|Criando prompts claros e específicos|10:00
6|Elementos de um Prompt|6:55
7|Persona, Público e Exemplos|8:04
8|Delimitadores e Saídas Estruturadas|8:03
9|Prompt Zero, One e Few-Shot|8:24
10|Quiz – Clareza e Especificidade|-"""),
    ("Dando tempo para o modelo pensar", """
11|Dando tempo para o modelo pensar (COT)|9:14
12|Prompts avançados: exemplos do Claude|-
13|Encadeamento (Chaining)|11:01"""),
    ("Aplicações comuns de prompts", """
14|Resumo e Extração|7:52
15|Inferência e Análise de Sentimento|7:03
16|Transformando, traduzindo e modificando|6:40
17|Criação de Chatbots Personalizados|7:51
18|Quiz – Aplicações de Prompts|-
19|Finalizando o curso de Engenharia de Prompt|4:21"""),
    ("Teste final", "20|Teste Final – Engenharia de Prompts|-")],
    note="Aulas 2, 4 e 16: zero riscado [VERIFICAR].")
course("AGNO-001", "Criando Agentes com Agno", 370, "curso", ["agents", "tools", "rag", "multiagent", "apis", "python"], [
    ("Introdução", """
1|O que o Agno tem de especial?|3:07
2|Aviso de versão|-
3|O que são agentes de IA?|2:37
4|Como um agente executa tarefas?|3:40
5|Agno ou Langchain?|1:58
6|Quiz 1 – Introdução|-"""),
    ("Criando agentes com Agno", """
7|Configurando o Agno|11:04
8|Guia de Instalação e Configuração do Agno|-
9|Criando nosso primeiro Agente|11:57
10|Criando nossas próprias Tools|7:18
11|Usando o ChatGPT via API|6:21
12|AgentOS e AgentUI: instalação e integração|19:26
13|Storage|20:58
14|Memória|10:37
15|Adicionando conhecimento externo ao agente com RAG|26:30
16|Sistemas multi-agentes|27:45
17|Quiz 2 – Criando Agentes com Agno|-"""),
    ("Deploy com Agno", """
18|O que é o deploy?|3:26
19|O que você precisa saber para fazer seu deploy|27:05
20|FastAPI – nossa escolha para deploy|17:38
21|Guia de Instalação e Configuração de Deploy com Agno|-
22|Como funciona uma API com FastAPI?|21:16
23|Criando endpoints para agentes com FastAPI|26:29
24|Agno AgentOS – uma alternativa simplificada|22:53
25|Frontend para sua API com AgentUI|15:36
26|Frontend para sua API com Streamlit|57:09
27|GitHub e Deploy no Render|-
28|Deploy do projeto no Render|25:29
29|Quiz 3 – Deploy com Agno|-
30|Teste Final – Criando Agentes com Agno|-""")])
course("AGENT-001", "Agente de Curadoria de Notícias", 63, "projeto", ["agents", "multiagent"], [("Projeto completo", """
1|Introdução – Agente de Curadoria de Notícias|2:48
2|Visão do projeto|12:37
3|Monolito com prompt embutido|9:42
4|Skills externas e separação prompt × código|13:50
5|Pipeline multiagente sequencial|10:11
6|Workflow declarativo|14:11""")])
course("AGENT-002", "Agente de IA para criação de conteúdo", 93, "projeto", ["agents", "systems"], [("Projeto completo", """
1|Apresentação do projeto|3:28
2|AI Setup|7:16
3|Setup manual|9:58
4|O Agente em ação|8:27
5|Como construiremos este projeto|2:46
6|Criando o Transcripter|17:18
7|Criando o Agente|6:09
8|O cérebro do modelo – desenvolvendo o prompt|21:35
9|Lendo as transcrições|16:29""")])
course("AGENT-003", "FilmPro - Agente para Recomendação de Filmes", 115, "projeto", ["agents", "apis", "systems"], [
    ("Agente de recomendações de filmes", """
1|Introdução|2:11
2|Arquitetura do Projeto|5:03
3|Versão Básica do FilmPro|21:03
4|Pydantic com Agno – Saídas Estruturadas|22:45
5|Ferramenta com Agno – API do OMDB|14:03"""),
    ("API de recomendações de filmes", """
6|Reorganização do Código|15:23
7|FastAPI – API de Recomendações|20:23"""),
    ("Construindo a interface web", "8|Interface Web|14:18")])
course("AGENT-004", "Auto Retoucher - Criando uma AI para fotógrafos", 105, "projeto", ["agents", "tools", "apis", "systems"], [("Projeto completo", """
1|Apresentação|2:13
2|AI Setup|4:45
3|Setup manual|6:20
4|Como construiremos o nosso projeto|5:08
5|Que modelos de IA serão utilizados|6:21
6|Rodando o Moondreeam3|15:08
7|Integrando com FalAI|10:28
8|Desenvolvendo o Agente com Gemini|11:47
9|Criando nossa Tool|14:03
10|Criando nossa API usando AI|9:24
11|Criando o Frontend|20:05""")])

G1, G2 = "Produtividade pessoal com IA", "Criando sistemas profissionais de inteligência artificial"
TRACKS = [
    ("T1", 1, "Dominando o ecossistema Claude", G1, 410, ["START-CLAUDE", "GENAI-001", "CLAUDE-001", "CODE-001", "CLAUDE-002"]),
    ("T2", 2, "Dominando Openclaw", G1, 324, ["START-OPENCLAW", "GENAI-001", "OPENCLAW-001", "OPENCLAW-002"]),
    ("T3", 3, "Criando Agentes Pessoais com Hermes Agent", G1, 215, ["START-HERMES", "GENAI-001", "HERMES-001"]),
    ("T4", 4, "Agentes com GPT", G1, 143, ["START-GPT", "GENAI-001", "GPT-001"]),
    ("T5", 5, "Aplicações Inteligentes com IA", G2, 587, ["START-APPS", "GENAI-001", "PY-001", "PY-002", "UI-001", "LANG-001", "LANG-002"]),
    ("T6", 6, "Ferramentas de AI para Desenvolvedores", G2, 531, ["START-TOOLS", "IDE-001", "IDE-002", "IDE-003", "CODE-001", "CODE-002"]),
    ("T7", 7, "Criando agentes de atendimento no N8N", G2, 615,
     ["START-N8N", "N8N-001", "N8N-002", "N8N-003", "N8N-004", "N8N-005", "N8N-006", "N8N-007"]),
    ("T8", 8, "Aplicações AI com Python", G2, 1611,
     ["START-PYTHON", "GENAI-001", "LLM-001", "LOGIC-001", "PYTHON-001", "SETUP-001", "PROMPT-001", "AGNO-001",
      "AGENT-001", "AGENT-002", "AGENT-003", "AGENT-004"]),
]


def build():
    contents = {}
    for cid, c in C.items():
        mods = []
        for mi, m in enumerate(c["modules"], start=1):
            lessons = []
            for l in m["lessons"]:
                item = {"id": f"{cid}.L{l['n']:02d}", "n": l["n"], "title": l["title"], "kind": l["kind"]}
                if l["seconds"] is not None:
                    item["duration"] = f"{l['seconds'] // 60}:{l['seconds'] % 60:02d}"
                lessons.append(item)
            mods.append({"id": f"{cid}.M{mi}", "title": m["title"], "lessons": lessons})
        contents[cid] = {"title": c["title"], "type": c["type"], "card_min": c["card_min"],
                         "competencies": c["competencies"], "modules": mods}
        if c["note"]:
            contents[cid]["note"] = c["note"]
    data = {
        "meta": {
            "catalog_version": 3,
            "name": "Formação Engenheiro de Agentes de IA",
            "provider": "Asimov Academy",
            "declared_video": "62:34:00",
            "declared_tracks": 8,
            "source": "Player da plataforma (aulas com duração individual), enviado em 12/11/2026",
            "duration_rule": "Duração do curso = soma das durações das aulas. Aula sem duração = '-' (0 min).",
            "excluded": [
                "Projetos para Professores (eletivo da trilha Dominando o ecossistema Claude) — fora do programa",
                "Para se aprofundar (eletivo da trilha Aplicações Inteligentes com IA) — fora do programa",
                "Git e GitHub – Controle de Versão e Colaboração (eletivo Webapps: 20 aulas, 3h08m34s) — fora do cronograma",
            ],
            "competencies_note": "Classificação de competências por curso feita pelo sistema (INFERIDO), editável no JSON.",
        },
        "tracks": [{"id": t[0], "order": t[1], "title": t[2], "group": t[3], "header_min": t[4], "courses": t[5]} for t in TRACKS],
        "contents": contents,
    }
    return data


def report(data):
    ok = True
    print(f"{'curso':14} {'aulas':>5} {'soma':>10} {'card':>7} {'dif':>6}")
    tot_sec, tot_lessons, nodur = 0, 0, 0
    for cid, c in data["contents"].items():
        secs = sum(sum(dur(l["duration"]) if "duration" in l else 0 for l in m["lessons"]) for m in c["modules"])
        n = sum(len(m["lessons"]) for m in c["modules"])
        nd = sum(1 for m in c["modules"] for l in m["lessons"] if "duration" not in l)
        diff = secs / 60 - c["card_min"]
        flag = "  <<< CONFERIR" if abs(diff) > 2 else ""
        if flag:
            ok = False
        print(f"{cid:14} {n:5} {secs // 3600}:{secs % 3600 // 60:02d}:{secs % 60:02d} {c['card_min']:7} {diff:6.1f}{flag}")
        tot_sec += secs
        tot_lessons += n
        nodur += nd
    print(f"\nCursos únicos: {len(data['contents'])} · aulas: {tot_lessons} · sem duração: {nodur}")
    print(f"Único: {tot_sec // 3600}h{tot_sec % 3600 // 60:02d}m{tot_sec % 60:02d}s")
    gross = 0
    for t in data["tracks"]:
        s = sum(sum(dur(l["duration"]) if "duration" in l else 0 for m in data["contents"][c]["modules"] for l in m["lessons"]) for c in t["courses"])
        gross += s
        print(f"  {t['id']} {t['title'][:42]:42} {s // 3600}h{s % 3600 // 60:02d}m{s % 60:02d}s  (cabeçalho {t['header_min'] // 60}h{t['header_min'] % 60:02d})")
    print(f"Bruto: {gross // 3600}h{gross % 3600 // 60:02d}m{gross % 60:02d}s · aparições: {sum(len(t['courses']) for t in data['tracks'])}")
    return ok


if __name__ == "__main__":
    d = build()
    OUT.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    report(d)
    print(f"\nok: {OUT}")
