sub init()
    m.kicker = m.top.findNode("kicker")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.synopsis = m.top.findNode("synopsis")
    m.buttons = [m.top.findNode("detailsButton"), m.top.findNode("favoriteButton")]

    ts = Theme_typeScale()
    Ui_setFont(m.kicker, true, ts.caption)
    Ui_setFont(m.title, true, ts.display)
    Ui_setFont(m.meta, false, ts.label)
    Ui_setFont(m.synopsis, false, ts.body)

    m.highlight = 0
    m.top.observeField("focusedChild", "onFocusChanged")
    m.global.observeFieldScoped("themeId", "applyTheme")
    m.global.observeFieldScoped("favorites", "updateFavoriteButton")
    applyTheme()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.kicker.color = theme.accent
    m.title.color = theme.textPrimary
    m.meta.color = theme.textSecondary
    m.synopsis.color = theme.textPrimary
    for each button in m.buttons
        button.themeId = theme.id
    end for
end sub

sub onContentChanged()
    item = m.top.content
    if item = invalid then return
    m.kicker.text = "EM DESTAQUE  ·  " + AppConfig().demoKicker
    m.title.text = item.title
    m.meta.text = item.year + " · " + item.genre + " · " + item.duration
    m.synopsis.text = item.description
    updateFavoriteButton()
end sub

sub updateFavoriteButton()
    item = m.top.content
    if item = invalid then return
    if Fav_has(item.itemId) then
        m.buttons[1].text = "Nos favoritos"
    else
        m.buttons[1].text = "Adicionar aos favoritos"
    end if
    m.buttons[1].translation = [m.buttons[0].width + 18, 0]
end sub

sub onFocusChanged()
    focused = m.top.isInFocusChain()
    for i = 0 to m.buttons.Count() - 1
        m.buttons[i].highlighted = focused and (i = m.highlight)
    end for
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "left" and m.highlight > 0 then
        m.highlight = m.highlight - 1
        onFocusChanged()
        return true
    else if key = "right" and m.highlight < m.buttons.Count() - 1 then
        m.highlight = m.highlight + 1
        onFocusChanged()
        return true
    else if key = "OK" then
        if m.highlight = 0 then m.top.action = "details" else m.top.action = "favorite"
        return true
    else if key = "left" or key = "right" then
        ' Nas pontas, a tecla é consumida para o foco não "escapar" de lado.
        return true
    end if
    return false
end function
