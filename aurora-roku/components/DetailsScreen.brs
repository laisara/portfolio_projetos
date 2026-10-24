sub init()
    m.base = m.top.findNode("base")
    m.backdrop = m.top.findNode("backdrop")
    m.kicker = m.top.findNode("kicker")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.synopsis = m.top.findNode("synopsis")
    m.note = m.top.findNode("note")
    m.buttons = [m.top.findNode("primaryButton"), m.top.findNode("favoriteButton")]

    ts = Theme_typeScale()
    Ui_setFont(m.kicker, true, ts.caption)
    Ui_setFont(m.title, true, ts.display)
    Ui_setFont(m.meta, false, ts.label)
    Ui_setFont(m.synopsis, false, ts.body)
    Ui_setFont(m.note, false, ts.caption)

    m.highlight = 0
    m.top.observeField("focusedChild", "onFocusChanged")
    m.global.observeFieldScoped("themeId", "applyTheme")
    m.global.observeFieldScoped("favorites", "updateFavoriteButton")
    applyTheme()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.base.color = theme.background
    m.kicker.color = theme.accent
    m.title.color = theme.textPrimary
    m.meta.color = theme.textSecondary
    m.synopsis.color = theme.textPrimary
    m.note.color = theme.textSecondary
    for each button in m.buttons
        button.themeId = theme.id
    end for
end sub

' Chamado pelo MainScene antes de remover a camada: desfaz os
' observadores do nó global para não deixar callbacks em nós soltos.
function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    m.global.unobserveFieldScoped("favorites")
    return true
end function

sub onContentChanged()
    item = m.top.content
    if item = invalid then return
    m.backdrop.uri = item.backdrop
    m.kicker.text = CB_kicker(item)
    m.title.text = item.title
    m.meta.text = item.metaFull
    m.synopsis.text = item.description
    ' Botão principal contextual: "Abrir" para aplicativos e "Continuar"
    ' quando há progresso fictício. Nenhum deles faz o que o nome sugere.
    if item.kind = "app" then
        m.note.text = "Aplicativo fictício criado para demonstrar a interface. Nenhum aplicativo é aberto."
        m.buttons[0].text = "Abrir"
    else
        m.note.text = "Título fictício criado para demonstrar a interface. Nenhum vídeo é reproduzido."
        if item.progress > 0 then m.buttons[0].text = "Continuar" else m.buttons[0].text = "Assistir"
    end if
    updateFavoriteButton()
end sub

sub updateFavoriteButton()
    item = m.top.content
    if item = invalid then return
    if Fav_has(item.itemId) then
        m.buttons[1].text = "Remover dos favoritos"
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
    if key = "left" or key = "right" then
        if key = "left" then m.highlight = 0 else m.highlight = 1
        onFocusChanged()
        return true
    else if key = "OK" then
        item = m.top.content
        if m.highlight = 0 then
            if item.kind = "app" then
                m.top.message = AppConfig().demoLabel + ": o aplicativo não pode ser aberto nesta versão."
            else
                m.top.message = AppConfig().demoLabel + ": a reprodução não está disponível nesta versão."
            end if
        else if Fav_toggle(item.itemId) then
            m.top.message = item.title + " foi adicionado aos favoritos."
        else
            m.top.message = item.title + " foi removido dos favoritos."
        end if
        return true
    else if key = "up" or key = "down" then
        ' Só há uma linha de botões: consome a tecla para o foco não sair.
        return true
    end if
    return false
end function
