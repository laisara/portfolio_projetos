sub init()
    m.bg = m.top.findNode("bg")
    m.label = m.top.findNode("label")
    relayout()
end sub

function isTab() as boolean
    return m.top.variant = "tab"
end function

' Teclas do teclado da Busca: tamanho fixo (minWidth) e pílula pequena.
function isKey() as boolean
    return m.top.variant = "key"
end function

function useSmallPill() as boolean
    return isTab() or isKey()
end function

sub relayout()
    if isTab() then
        h = 60
        size = 27
        padding = 24
    else if isKey() then
        h = 66
        size = 30
        padding = 0
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

    if isKey() then
        w = Util_snap3(m.top.minWidth)
    else
        w = Util_snap3(Util_max(m.top.minWidth, textWidth + padding * 2))
    end if
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
    small = useSmallPill()
    if m.top.highlighted then
        if small then m.bg.uri = theme.assets.pillAccentSmall else m.bg.uri = theme.assets.pillAccent
        m.bg.visible = true
        m.label.color = theme.onAccent
    else if isKey() or not isTab() or m.top.active then
        if small then m.bg.uri = theme.assets.pillSurfaceSmall else m.bg.uri = theme.assets.pillSurface
        m.bg.visible = true
        m.label.color = theme.textPrimary
    else
        m.bg.visible = false
        m.label.color = theme.textSecondary
    end if
end sub
