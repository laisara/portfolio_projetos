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
    layoutData = DemoContent_layout()
    kind = m.top.kind
    m.notice.text = ""
    if kind = "series" then
        rows = layoutData.seriesRows
    else if kind = "library" then
        rows = layoutData.library
        m.notice.text = "Biblioteca de demonstração: itens e progresso fictícios, sem conta ou sincronização."
    else if kind = "favorites" then
        rows = favoriteRows()
        ' Atualiza na hora quando um favorito muda (inclusive pelos detalhes).
        m.global.observeFieldScoped("favorites", "onFavoritesChanged")
    else
        rows = layoutData.movieRows
    end if
    setRows(rows)
end sub

function favoriteRows() as object
    items = DemoContent_items()
    movies = []
    series = []
    for each id in m.global.favorites
        if items.DoesExist(id) then
            if items[id].kind = "series" then series.Push(id) else movies.Push(id)
        end if
    end for
    rows = []
    if movies.Count() > 0 then rows.Push({ title: "Filmes favoritos", ids: movies })
    if series.Count() > 0 then rows.Push({ title: "Séries favoritas", ids: series })
    return rows
end function

sub setRows(rows as object)
    hasItems = rows.Count() > 0
    m.rows.content = CB_rowsNode(rows)
    m.rows.visible = hasItems
    m.info.visible = hasItems
    m.empty.visible = not hasItems
    if hasItems then
        showInfo(CB_selectedNode(m.rows, [0, 0]))
    else
        m.emptyTitle.text = "Nenhum favorito ainda"
        m.emptyText.text = "Abra um título e escolha Adicionar aos favoritos. Ele aparece aqui na hora."
    end if
end sub

sub onFavoritesChanged()
    previous = m.rows.rowItemFocused
    setRows(favoriteRows())
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
    m.meta.text = node.year + " · " + node.genre + " · " + node.duration
    m.synopsis.text = node.description
end sub

sub onItemFocused()
    showInfo(CB_selectedNode(m.rows, m.rows.rowItemFocused))
end sub

sub onItemSelected()
    node = CB_selectedNode(m.rows, m.rows.rowItemSelected)
    if node <> invalid then m.top.itemSelected = node
end sub

' Retorna false quando não há o que focar (favoritos vazios): o
' MainScene mantém o foco na barra de abas.
function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    m.global.unobserveFieldScoped("favorites")
    return true
end function

function focusContent(_params = invalid as dynamic) as boolean
    if not m.rows.visible then return false
    m.rows.setFocus(true)
    return true
end function

function restoreFocus(_params = invalid as dynamic) as boolean
    Ui_traceFocus(m.rows)
    return focusContent()
end function

' Usado pelas coleções da tela inicial: abre a aba já na fileira certa.
function focusRow(row as dynamic) as boolean
    if row <> invalid and m.rows.content <> invalid and row < m.rows.content.getChildCount() then
        m.rows.jumpToRowItem = [row, 0]
    end if
    return focusContent()
end function
