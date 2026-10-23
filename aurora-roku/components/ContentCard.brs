sub init()
    m.frame = m.top.findNode("frame")
    m.placeholder = m.top.findNode("placeholder")
    m.art = m.top.findNode("art")
    m.ring = m.top.findNode("ring")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.progressTrack = m.top.findNode("progressTrack")
    m.progressFill = m.top.findNode("progressFill")

    Ui_setFont(m.title, true, 27)
    Ui_setFont(m.meta, false, 24)
    ' Se a imagem falhar, o retângulo de cor de superfície continua visível.
    m.art.observeField("loadStatus", "onArtStatus")
    ' Sem observador global: o RowList recria/revincula os itens, e a tela
    ' dona recria o conteúdo quando o tema muda.
    applyTheme()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.placeholder.color = theme.surface
    m.ring.uri = theme.assets.cardFocus
    m.title.color = theme.textPrimary
    m.meta.color = theme.textSecondary
    m.progressTrack.color = theme.surfaceRaised
    m.progressFill.color = theme.accent
end sub

sub onContentChanged()
    item = m.top.itemContent
    if item = invalid then return
    applyTheme()
    m.title.text = item.title
    m.meta.text = item.meta
    m.art.uri = item.HDPosterUrl

    progress = item.progress
    hasProgress = progress <> invalid and progress > 0
    m.progressTrack.visible = hasProgress
    m.progressFill.visible = hasProgress
    if hasProgress then m.progressFill.width = Util_snap3(384 * progress)
end sub

sub onArtStatus()
    ' "failed": mantém o retângulo de fundo e o título; nada quebra.
    m.placeholder.visible = (m.art.loadStatus <> "ready")
end sub

' Realce de foco: anel na cor de destaque + leve ampliação. Só aparece
' quando o próprio RowList tem o foco (padrão do sample oficial).
sub onFocusChanged()
    amount = m.top.focusPercent
    if not m.top.rowListHasFocus then amount = 0
    m.ring.opacity = amount
    s = 1 + 0.05 * amount
    m.frame.scale = [s, s]
end sub
