sub init()
    m.brand = m.top.findNode("brand")
    m.tabsGroup = m.top.findNode("tabs")
    m.demoBadge = m.top.findNode("demoBadge")

    Ui_setFont(m.brand, true, 36)
    Ui_setFont(m.demoBadge, false, 24)
    m.brand.text = AppConfig().appName
    m.demoBadge.text = "Versão demonstrativa"

    m.tabs = Nav_tabs()
    m.buttons = []
    x = 0
    for each tabInfo in m.tabs
        button = m.tabsGroup.createChild("PillButton")
        button.variant = "tab"
        button.text = tabInfo.label
        button.translation = [x, 0]
        x = x + button.width + 9
        m.buttons.Push(button)
    end for

    m.highlight = -1
    m.top.observeField("focusedChild", "onFocusChanged")
    m.global.observeFieldScoped("themeId", "applyTheme")
    applyTheme()
    onSelectedChanged()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.brand.color = theme.textPrimary
    m.demoBadge.color = theme.textSecondary
    for each button in m.buttons
        button.themeId = theme.id
    end for
end sub

sub onSelectedChanged()
    index = Nav_tabIndex(m.top.selectedId)
    for i = 0 to m.buttons.Count() - 1
        m.buttons[i].active = (i = index)
    end for
end sub

' Ao receber o foco, o realce começa sempre na aba ativa (previsível).
sub onFocusChanged()
    if m.top.isInFocusChain() then
        if m.highlight < 0 then setHighlight(Nav_tabIndex(m.top.selectedId))
    else
        setHighlight(-1)
    end if
end sub

sub setHighlight(index as integer)
    m.highlight = index
    for i = 0 to m.buttons.Count() - 1
        m.buttons[i].highlighted = (i = index)
    end for
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "left" then
        if m.highlight > 0 then setHighlight(m.highlight - 1)
        return true
    else if key = "right" then
        if m.highlight < m.buttons.Count() - 1 then setHighlight(m.highlight + 1)
        return true
    else if key = "OK" then
        if m.highlight >= 0 then m.top.tabSelected = m.tabs[m.highlight].id
        return true
    end if
    return false
end function
