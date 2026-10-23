' ==========================================================================
' NavigationLogic.brs — máquina de estados da navegação (pura).
'
' Estado:
'   tab      : aba ativa ("home", "movies", "series", "library",
'              "favorites", "settings")
'   zone     : onde está o foco ("nav" = barra de abas,
'              "content" = conteúdo da aba, "overlay" = detalhes)
'   overlay  : invalid ou "details"
'
' MainScene aplica as decisões; esta camada só decide, o que permite
' testar a hierarquia do Voltar sem um aparelho (tests/unit).
' Documentação completa: README.md, seção "Máquina de estados".
' ==========================================================================

function Nav_tabs() as object
    return [
        { id: "home", label: "Início" }
        { id: "movies", label: "Filmes" }
        { id: "series", label: "Séries" }
        { id: "library", label: "Minha biblioteca" }
        { id: "favorites", label: "Favoritos" }
        { id: "settings", label: "Configurações" }
    ]
end function

function Nav_tabIndex(tabId as string) as integer
    tabs = Nav_tabs()
    for i = 0 to tabs.Count() - 1
        if tabs[i].id = tabId then return i
    end for
    return -1
end function

function Nav_initialState() as object
    return { tab: "home", zone: "content", overlay: invalid }
end function

' Decide o que o Voltar faz. Ações possíveis:
'   "closeOverlay" — fecha os detalhes e devolve o foco ao cartão de origem
'   "goHome"       — volta para a aba Início (foco na barra de abas)
'   "focusNav"     — no Início, sobe o foco do conteúdo para a barra
'   "exit"         — não trata a tecla: o sistema Roku encerra o app
function Nav_onBack(state as object) as string
    if state.overlay <> invalid then return "closeOverlay"
    if state.tab <> "home" then return "goHome"
    if state.zone = "content" then return "focusNav"
    return "exit"
end function

' Aplica uma ação ao estado e devolve o novo estado (sem efeitos).
function Nav_apply(state as object, action as string, arg = invalid as dynamic) as object
    nextState = { tab: state.tab, zone: state.zone, overlay: state.overlay }
    if action = "closeOverlay" then
        nextState.overlay = invalid
        nextState.zone = "content"
    else if action = "goHome" then
        nextState.tab = "home"
        nextState.zone = "nav"
    else if action = "focusNav" then
        nextState.zone = "nav"
    else if action = "focusContent" then
        nextState.zone = "content"
    else if action = "selectTab" then
        if Nav_tabIndex(arg) >= 0 then nextState.tab = arg
        nextState.zone = "nav"
    else if action = "openDetails" then
        nextState.overlay = "details"
        nextState.zone = "overlay"
    end if
    return nextState
end function
