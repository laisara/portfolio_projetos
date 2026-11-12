"""Constantes do domínio: competências, natureza do conteúdo, XP e níveis."""
from __future__ import annotations

# Competências --------------------------------------------------------------
# baseline = conhecimento prévio declarado (Python, SQL, APIs, automação, n8n...)
COMPETENCIES: list[dict] = [
    {"id": "python", "short": "Python", "label": "Python & Programação com IA", "baseline": 0.70},
    {"id": "apis", "short": "APIs", "label": "APIs & Integrações", "baseline": 0.40},
    {"id": "fundamentals", "short": "Fundamentos", "label": "Fundamentos de LLM / IA Generativa", "baseline": 0.10},
    {"id": "prompt", "short": "Prompt", "label": "Prompt & Context Engineering", "baseline": 0.15},
    {"id": "aicoding", "short": "AI Coding", "label": "Desenvolvimento assistido por IA", "baseline": 0.10},
    {"id": "tools", "short": "Tools/MCP", "label": "Tool Calling, Skills & MCP", "baseline": 0.05},
    {"id": "agents", "short": "Agents", "label": "AI Agents", "baseline": 0.05},
    {"id": "rag", "short": "RAG", "label": "RAG", "baseline": 0.0},
    {"id": "multiagent", "short": "Multi-Agent", "label": "Multi-Agent & SubAgents", "baseline": 0.0},
    {"id": "systems", "short": "AI Systems", "label": "AI Applications & Systems", "baseline": 0.10},
]
COMPETENCY_IDS = {c["id"] for c in COMPETENCIES}
# Peso de cada evidência no progresso de uma competência
COMPETENCY_WEIGHTS = {"content": 0.35, "practice": 0.30, "project": 0.25, "review": 0.10}

# Natureza do conteúdo → fase do ciclo e ação de prática --------------------
NATURES: dict[str, dict] = {
    "conceitual": {"phase": "ENTENDER", "action": "Resumo com suas palavras + perguntas de autoexplicação + mini-experimento"},
    "ferramenta": {"phase": "CONSTRUIR", "action": "Reproduzir o fluxo da aula no seu próprio ambiente e projeto"},
    "tecnico": {"phase": "CONSTRUIR", "action": "Implementar em código o conceito da aula"},
    "agentes": {"phase": "CONSTRUIR", "action": "Construir/configurar o agente mostrado na aula e testar variações"},
    "projeto": {"phase": "CONSTRUIR", "action": "Construir o projeto do curso em paralelo à aula"},
    "reserva": {"phase": "CONSTRUIR", "action": "Prática do conteúdo (definir após mapear o curso)"},
}
PHASES = {"video": "APRENDER", "project": "CONSOLIDAR", "review": "REVISAR"}

# XP: fazer > assistir ------------------------------------------------------
XP_PER_MIN = {"VIDEO": 1.0, "PRACTICE": 2.0, "PROJECT": 2.5, "REVIEW": 1.5, "OTHER": 0.5}
XP_SESSION_CAP_MIN = 240  # minutos máximos de XP por sessão
XP_LESSON = 15
XP_PRACTICE_UNIT = 30
XP_REVIEW_ON_TIME = 15
XP_REVIEW_LATE = 5
XP_LAB_TASK = 40
XP_MILESTONE = 150
XP_STAGE = 400
XP_FINAL_STAGE = 1000
XP_CONTENT_DONE = 100

LEVELS = [
    {"id": 1, "name": "Explorer", "xp": 0, "tagline": "Mapeando o território da IA generativa."},
    {"id": 2, "name": "Builder", "xp": 1500, "tagline": "Transformando aulas em código que roda."},
    {"id": 3, "name": "Agent Builder", "xp": 5000, "tagline": "Primeiros agentes com ferramentas."},
    {"id": 4, "name": "AI Engineer", "xp": 10000, "tagline": "LLMs integrados a sistemas reais."},
    {"id": 5, "name": "Agent Engineer", "xp": 17000, "tagline": "Agentes, RAG e orquestração com método."},
    {"id": 6, "name": "AI Systems Architect", "xp": 25000, "tagline": "Desenha sistemas de IA de ponta a ponta."},
]

WEEKDAYS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
