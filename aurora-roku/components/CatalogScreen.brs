sub init()
    m.info = m.top.findNode("info")
    m.kicker = m.top.findNode("kicker")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.synopsis = m.top.findNode("synopsis")
    m.notice = m.top.findNode("notice")
    m.empty = m.top.findNode("empty")
    m.emptyPanel = m.top.findNode("emptyPanel")
    m.emptyTitle = m.top.findNode("emptyTitle")
    m.emptyText = m.top.findNode("emptyText")
    m.rows = m.top.findNode("rows")

    ts = Theme_typeScale()
    Ui_setFont(m.kicker, true, ts.caption)
    Ui_setFont(m.title, true, ts.title)
    Ui_setFont(m.meta, false, ts.label)
    Ui_setFont(m.synopsis, false, ts.body)
    Ui_setFont(m.notice, false, ts.caption)
    Ui_setFont(m.emptyTitle, true, ts.heading)
    Ui_setFont(m.emptyText, false, ts.body)

    m.rows.observeField("rowItemFocused", "onItemFocused")
    m.rows.observeField("rowItemSelected", "onItemSelected")
    m.global.observeFieldScoped("themeId", "applyTheme")
    applyTheme()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.kicker.color = theme.accent
    m.title.color = theme.textPrimary
    m.meta.color = theme.textSecondary
    m.synopsis.color = theme.textPrimary
    m.notice.color = theme.textSecondary
    m.emptyPanel.uri = theme.assets.panel
    m.emptyTitle.color = theme.textPrimary
    m.emptyText.color = theme.textSecondary
    Ui_styleRowList(m.rows)
end sub

sub build()
    setRows(buildRowData())
    if m.top.kind = "library" then
        ' Atualiza na hora quando um favorito muda (inclusive pelos detalhes).
        m.global.observeFieldScoped("favorites", "onFavoritesChanged")
    end if
end sub

' Linhas da aba atual. Na Biblioteca, a fileira Favoritos só existe
' quando há favoritos.
function buildRowData() as object
    layoutData = DemoContent_layout()
    kind = m.top.kind
    m.notice.text = ""
    if kind = "series" then
        return layoutData.seriesRows
    else if kind = "apps" then
        m.notice.text = "Aplicativos fictícios: não podem ser abertos nesta versão."
        return layoutData.appRows
    else if kind = "library" then
        m.notice.text = "Biblioteca de demonstração: itens e progresso fictícios, sem conta ou sincronização."
        rows = [{ title: "Continue assistindo", items: layoutData.libraryContinue }]
        if m.global.favorites.Count() > 0 then rows.Push({ title: "Favoritos", ids: m.global.favorites })
        rows.Push({ title: "Salvos para depois", ids: layoutData.librarySaved })
        return rows
    end if
    return layoutData.movieRows
end function

sub setRows(rows as object)
    m.rows.content = CB_rowsNode(rows)
    ' Dados vazios ou incompletos: sem fileiras válidas, mostra o estado vazio.
    hasItems = m.rows.content.getChildCount() > 0
    m.rows.visible = hasItems
    m.info.visible = hasItems
    m.empty.visible = not hasItems
    if hasItems then
        showInfo(CB_selectedNode(m.rows, [0, 0]))
    else
        m.emptyTitle.text = "Nada por aqui ainda"
        m.emptyText.text = "Não há itens para mostrar nesta seção."
    end if
end sub

sub onFavoritesChanged()
    previous = m.rows.rowItemFocused
    setRows(buildRowData())
    ' Mantém o foco perto de onde estava, dentro dos limites novos.
    content = m.rows.content
    validPrevious = type(previous) = "roArray" and previous.Count() = 2 and previous[0] <> invalid and previous[0] >= 0
    if validPrevious and content.getChildCount() > 0 then
        row = Util_min(previous[0], content.getChildCount() - 1)
        col = Util_min(previous[1], content.getChild(row).getChildCount() - 1)
        m.rows.jumpToRowItem = [row, col]
    end if
end sub

sub showInfo(node as dynamic)
    if node = invalid then return
    m.kicker.text = CB_kicker(node)
    m.title.text = node.title
    m.meta.text = node.metaFull
    m.synopsis.text = node.description
end sub

sub onItemFocused()
    showInfo(CB_selectedNode(m.rows, m.rows.rowItemFocused))
end sub

sub onItemSelected()
    node = CB_selectedNode(m.rows, m.rows.rowItemSelected)
    if node <> invalid then m.top.itemSelected = node
end sub

function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    m.global.unobserveFieldScoped("favorites")
    return true
end function

' Retorna false quando não há o que focar (estado vazio): o MainScene
' mantém o foco na barra de abas.
function focusContent(_params = invalid as dynamic) as boolean
    if not m.rows.visible then return false
    m.rows.setFocus(true)
    return true
end function

function restoreFocus(_params = invalid as dynamic) as boolean
    Ui_traceFocus(m.rows)
    return focusContent()
end function
