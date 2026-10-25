sub init()
    m.background = m.top.findNode("background")
    m.screenLayer = m.top.findNode("screenLayer")
    m.nav = m.top.findNode("nav")
    m.overlayLayer = m.top.findNode("overlayLayer")
    m.toast = m.top.findNode("toast")
    m.details = invalid

    m.state = Nav_initialState()
    m.home = createScreen("home")
    m.current = m.home

    m.nav.observeField("tabSelected", "onTabSelected")
    m.global.observeFieldScoped("themeId", "applyTheme")
    m.global.observeFieldScoped("persistenceStatus", "onPersistenceChanged")
    applyTheme()

    ' Foco explícito num filho da cena: requisito da Roku para que o
    ' Voltar no último nível encerre o app (backExitsScene).
    m.home.callFunc("focusContent", invalid)
end sub

sub applyTheme()
    m.background.uri = Ui_theme().assets.background
end sub

' Cria a tela de uma aba. Só o Início fica em memória o tempo todo; as
' demais são recriadas a cada visita e removidas ao sair, liberando
' texturas no aparelho de 512 MB.
function createScreen(tabId as string) as object
    if tabId = "home" then
        screen = m.screenLayer.createChild("HomeScreen")
    else if tabId = "settings" then
        screen = m.screenLayer.createChild("SettingsScreen")
    else if tabId = "search" then
        screen = m.screenLayer.createChild("SearchScreen")
    else
        screen = m.screenLayer.createChild("CatalogScreen")
        screen.kind = tabId
    end if
    if screen.hasField("itemSelected") then screen.observeField("itemSelected", "onItemSelected")
    if screen.hasField("message") then screen.observeField("message", "onMessage")
    return screen
end function

sub showTab(tabId as string)
    if tabId = m.state.tab and m.current <> invalid then return
    if not m.current.isSameNode(m.home) then
        m.current.callFunc("dispose", invalid)
        m.screenLayer.removeChild(m.current)
    end if
    if tabId = "home" then
        m.current = m.home
        m.home.callFunc("resetView", invalid)
        m.home.visible = true
    else
        m.home.visible = false
        m.current = createScreen(tabId)
    end if
    m.nav.selectedId = tabId
    m.state.tab = tabId
    traceState()
end sub

sub setState(newState as object)
    m.state = newState
    traceState()
end sub

' Uma linha por transição no console de depuração (diagnóstico e
' verificação automatizada no simulador).
sub traceState()
    overlay = "none"
    if m.state.overlay <> invalid then overlay = m.state.overlay
    print "AURORA_NAV tab=" + m.state.tab + " zone=" + m.state.zone + " overlay=" + overlay
end sub

sub focusNav()
    m.nav.setFocus(true)
    setState(Nav_apply(m.state, "focusNav"))
end sub

sub focusContent()
    if m.current.callFunc("focusContent", invalid) then
        setState(Nav_apply(m.state, "focusContent"))
    end if
end sub

sub onTabSelected()
    tabId = m.nav.tabSelected
    showTab(tabId)
    setState(Nav_apply(m.state, "selectTab", tabId))
end sub

sub onItemSelected(event as object)
    node = event.getData()
    if node = invalid then return
    print "AURORA_DETAILS " + node.itemId
    m.details = m.overlayLayer.createChild("DetailsScreen")
    m.details.observeField("message", "onMessage")
    m.details.content = node
    m.details.setFocus(true)
    setState(Nav_apply(m.state, "openDetails"))
end sub

sub closeDetails()
    if m.details <> invalid then
        m.details.callFunc("dispose", invalid)
        m.overlayLayer.removeChild(m.details)
        m.details = invalid
    end if
    setState(Nav_apply(m.state, "closeOverlay"))
    ' Devolve o foco ao cartão de origem (o RowList preserva a posição).
    if not m.current.callFunc("restoreFocus", invalid) then focusNav()
end sub

' Avisa o usuário quando o aparelho não conseguiu gravar as alterações.
sub onPersistenceChanged()
    if m.global.persistenceStatus = AppState_statusFail() then
        m.toast.message = "Não foi possível salvar as alterações neste aparelho."
        print "AURORA_PERSIST falha"
    end if
end sub

sub onMessage(event as object)
    m.toast.message = event.getData()
    print "AURORA_TOAST " + event.getData()
end sub

' Recebe só as teclas que nenhum componente focado tratou.
function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "back" then
        action = Nav_onBack(m.state)
        if action = "closeOverlay" then
            closeDetails()
        else if action = "goHome" then
            showTab("home")
            setState(Nav_apply(m.state, "goHome"))
            m.nav.setFocus(true)
        else if action = "focusNav" then
            focusNav()
        else
            ' "exit": não tratar deixa o sistema Roku encerrar o app.
            return false
        end if
        return true
    else if key = "up" and m.state.zone = "content" then
        focusNav()
        return true
    else if key = "down" and m.state.zone = "nav" then
        focusContent()
        return true
    end if
    return false
end function
