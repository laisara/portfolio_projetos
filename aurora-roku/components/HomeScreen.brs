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

    ' Dados demonstrativos locais (DemoContent.brs); nenhuma rede.
    layoutData = DemoContent_layout()
    m.featured = CB_itemNode(layoutData.featured)
    m.hero.content = m.featured
    m.backdrop.uri = m.featured.backdrop


    m.zone = "hero" ' "hero" ou "rows": região que recebe o foco ao voltar
    m.hero.observeField("action", "onHeroAction")
    m.rows.observeField("rowItemSelected", "onRowItemSelected")
    m.global.observeFieldScoped("themeId", "applyTheme")
    applyTheme()
end sub

sub applyTheme()
    m.dim.color = Ui_theme().background
    Ui_styleRowList(m.rows)
    buildRows()
end sub

' Dados demonstrativos locais; recriar o conteúdo também reaplica o tema
' aos cartões (o RowList preserva a fileira e o item focados).
sub buildRows()
    focused = m.rows.rowItemFocused
    collections = []
    for each collection in DemoContent_collections()
        collections.Push(CB_collectionNode(collection))
    end for
    m.rows.content = CB_rowsNode([
        { title: "Continue explorando", ids: DemoContent_layout().explore }
        { title: "Coleções", nodes: collections }
    ])
    if type(focused) = "roArray" and focused.Count() = 2 and focused[0] <> invalid then m.rows.jumpToRowItem = focused
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

' Volta ao estado inicial (destaque visível, primeira fileira) sem
' animação. Usado quando o usuário retorna ao Início vindo de outra aba.
function resetView(_params = invalid as dynamic) as boolean
    m.shift.control = "stop"
    m.zone = "hero"
    m.content.translation = [0, 0]
    m.hero.opacity = 1.0
    m.dim.opacity = 0.0
    m.rows.jumpToRowItem = [0, 0]
    return true
end function

sub onHeroAction()
    if m.hero.action = "details" then
        m.top.itemSelected = m.featured
    else if m.hero.action = "favorite" then
        if Fav_toggle(m.featured.itemId) then
            m.top.message = m.featured.title + " foi adicionado aos favoritos."
        else
            m.top.message = m.featured.title + " foi removido dos favoritos."
        end if
    end if
end sub

sub onRowItemSelected()
    node = CB_selectedNode(m.rows, m.rows.rowItemSelected)
    if node = invalid then return
    if node.kind = "collection" then
        m.top.navigateTo = { tab: node.target, row: node.targetRow }
    else
        m.top.itemSelected = node
    end if
end sub

' Move o conteúdo entre o estado "destaque" e o estado "fileiras".
sub setZone(zone as string)
    if zone = m.zone then return
    m.zone = zone
    if zone = "rows" then
        m.shiftContent.keyValue = [[0, 0], [0, -531]]
        m.shiftHero.keyValue = [1.0, 0.0]
        m.shiftDim.keyValue = [0.0, 0.6]
        m.rows.setFocus(true)
    else
        m.shiftContent.keyValue = [[0, -531], [0, 0]]
        m.shiftHero.keyValue = [0.0, 1.0]
        m.shiftDim.keyValue = [0.6, 0.0]
        m.hero.setFocus(true)
    end if
    m.shift.control = "start"
end sub

' Só recebe as teclas que o destaque ou o RowList não trataram.
' "up" na primeira fileira volta ao destaque; "up" no destaque não é
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
