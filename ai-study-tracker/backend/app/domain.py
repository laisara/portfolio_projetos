"""Constantes do domínio: competências, natureza do conteúdo, XP e níveis."""
from __future__ import annotations

# Competências --------------------------------------------------------------
# baseline = ponto de partida ESTIMADO (editável em Ajustes); não é um fato medido.
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
# Peso das evidências no progresso de uma competência (conteúdo concluído + revisões em dia)
COMPETENCY_WEIGHTS = {"content": 0.8, "review": 0.2}

# XP: fazer > assistir (sessões manuais de prática/projeto valem mais que vídeo)
XP_PER_MIN = {"VIDEO": 1.0, "PRACTICE": 2.0, "PROJECT": 2.5, "REVIEW": 1.5, "OTHER": 0.5}
XP_SESSION_CAP_MIN = 240  # minutos máximos de XP por sessão
XP_LESSON = 15
XP_REVIEW_ON_TIME = 15
XP_REVIEW_LATE = 5
XP_CONTENT_DONE = 100
XP_TRACK_DONE = 300

LEVELS = [
    {"id": 1, "name": "Explorer", "xp": 0, "tagline": "Mapeando o território da IA generativa."},
    {"id": 2, "name": "Builder", "xp": 1000, "tagline": "Transformando aulas em hábito e código."},
    {"id": 3, "name": "Agent Builder", "xp": 3500, "tagline": "Primeiros agentes com ferramentas."},
    {"id": 4, "name": "AI Engineer", "xp": 7500, "tagline": "LLMs integrados a sistemas reais."},
    {"id": 5, "name": "Agent Engineer", "xp": 12500, "tagline": "Agentes, RAG e orquestração com método."},
    {"id": 6, "name": "AI Systems Architect", "xp": 18000, "tagline": "Desenha sistemas de IA de ponta a ponta."},
]

WEEKDAYS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
