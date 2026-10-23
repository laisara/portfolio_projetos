sub init()
    m.bg = m.top.findNode("bg")
    m.label = m.top.findNode("label")
    relayout()
end sub

function isTab() as boolean
    return m.top.variant = "tab"
end function

sub relayout()
    if isTab() then
        h = 60
        size = 27
        padding = 30
    else
        h = 72
        size = 30
        padding = 39
    end if
    Ui_setFont(m.label, true, size)

    ' Mede o texto com largura automática e só depois fixa o tamanho.
    m.label.width = 0
    m.label.height = 0
    m.label.text = m.top.text
    textWidth = m.label.boundingRect().width
    if textWidth <= 0 then textWidth = Len(m.top.text) * size * 0.55

    w = Util_snap3(Util_max(m.top.minWidth, textWidth + padding * 2))
    m.bg.width = w
    m.bg.height = h
    m.label.width = w
    m.label.height = h
    m.top.width = w
    m.top.height = h
    refresh()
end sub

sub refresh()
    theme = Ui_theme()
    if m.top.highlighted then
        if isTab() then m.bg.uri = theme.assets.pillAccentSmall else m.bg.uri = theme.assets.pillAccent
        m.bg.visible = true
        m.label.color = theme.onAccent
    else if not isTab() or m.top.active then
        if isTab() then m.bg.uri = theme.assets.pillSurfaceSmall else m.bg.uri = theme.assets.pillSurface
        m.bg.visible = true
        m.label.color = theme.textPrimary
    else
        m.bg.visible = false
        m.label.color = theme.textSecondary
    end if
end sub
