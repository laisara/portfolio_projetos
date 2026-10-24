sub init()
    m.backdrop = m.top.findNode("backdrop")
    m.dim = m.top.findNode("dim")
    m.hero = m.top.findNode("hero")
    m.content = m.top.findNode("content")
    m.rows = m.top.findNode("rows")
    m.shift = m.top.findNode("shift")
    m.shiftContent = m.top.findNode("shiftContent")
    m.shiftHero = m.top.findNode("shiftHero")
    m.shiftDim = m.top.findNode("shiftDim")

    m.current = invalid
    m.zone = "hero" ' "hero" ou "rows": região que recebe o foco ao voltar
    m.hero.observeField("current", "onBannerChanged")
    m.hero.observeField("action", "onHeroAction")
    m.rows.observeField("rowItemSelected", "onRowItemSelected")
    m.global.observeFieldScoped("themeId", "applyTheme")

    ' Dados demonstrativos locais (DemoContent.brs); nenhuma rede.
    m.hero.slides = DemoContent_layout().featured
    applyTheme()
end sub

function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    return true
end function

sub applyTheme()
    m.dim.color = Ui_theme().background
    Ui_styleRowList(m.rows)
    buildRows()
end sub

' Recriar o conteúdo também reaplica o tema aos cartões; o RowList
' preserva a fileira e o item focados.
sub buildRows()
    focused = m.rows.rowItemFocused
    m.rows.content = CB_rowsNode(DemoContent_layout().homeRows)
    if type(focused) = "roArray" and focused.Count() = 2 and focused[0] <> invalid then
        if focused[0] >= 0 and focused[0] < m.rows.content.getChildCount() then m.rows.jumpToRowItem = focused
    end if
end sub

sub onBannerChanged()
    node = m.hero.current
    if node = invalid then return
    m.current = node
    m.backdrop.uri = node.backdrop
end sub

function focusContent(_params = invalid as dynamic) as boolean
    if m.zone = "rows" then
        m.rows.setFocus(true)
    else
        m.hero.setFocus(true)
    end if
    return true
end function

function restoreFocus(_params = invalid as dynamic) as boolean
    if m.zone = "rows" then Ui_traceFocus(m.rows)
    return focusContent()
end function

' Volta ao estado inicial (banner visível, primeira fileira) sem
' animação. Usado quando o usuário retorna ao Início vindo de outra aba.
function resetView(_params = invalid as dynamic) as boolean
    m.shift.control = "stop"
    m.zone = "hero"
    applyZoneState("hero")
    m.rows.jumpToRowItem = [0, 0]
    return true
end function

sub onHeroAction()
    if m.current <> invalid then m.top.itemSelected = m.current
end sub

sub onRowItemSelected()
    node = CB_selectedNode(m.rows, m.rows.rowItemSelected)
    if node <> invalid then m.top.itemSelected = node
end sub

' Estado final de cada região (usado sem animação).
sub applyZoneState(zone as string)
    if zone = "rows" then
        m.content.translation = [0, -642]
        m.hero.opacity = 0.0
        m.dim.opacity = 0.75
    else
        m.content.translation = [0, 0]
        m.hero.opacity = 1.0
        m.dim.opacity = 0.0
    end if
end sub

' Move o conteúdo entre o estado "banner" e o estado "fileiras".
sub setZone(zone as string)
    if zone = m.zone then return
    m.zone = zone
    if zone = "rows" then
        m.shiftContent.keyValue = [[0, 0], [0, -642]]
        m.shiftHero.keyValue = [1.0, 0.0]
        m.shiftDim.keyValue = [0.0, 0.75]
        m.rows.setFocus(true)
    else
        m.shiftContent.keyValue = [[0, -642], [0, 0]]
        m.shiftHero.keyValue = [0.0, 1.0]
        m.shiftDim.keyValue = [0.75, 0.0]
        m.hero.setFocus(true)
    end if
    if m.global.animations then
        m.shift.control = "start"
    else
        applyZoneState(zone)
    end if
    print "AURORA_HOME zone=" + zone + " animations=" + LCase(m.global.animations.ToStr())
end sub

' Só recebe as teclas que o banner ou o RowList não trataram.
' "up" na primeira fileira volta ao banner; "up" no banner não é
' tratado aqui e sobe para o MainScene (barra de abas).
function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "down" and m.zone = "hero" then
        setZone("rows")
        return true
    else if key = "up" and m.zone = "rows" then
        setZone("hero")
        return true
    end if
    return false
end function
