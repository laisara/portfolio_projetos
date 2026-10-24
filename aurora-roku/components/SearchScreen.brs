sub init()
    m.keyboard = m.top.findNode("keyboard")
    m.keyFocus = m.top.findNode("keyFocus")
    m.heading = m.top.findNode("heading")
    m.queryPanel = m.top.findNode("queryPanel")
    m.queryText = m.top.findNode("queryText")
    m.status = m.top.findNode("status")
    m.hint = m.top.findNode("hint")
    m.emptyGroup = m.top.findNode("emptyGroup")
    m.emptyPanel = m.top.findNode("emptyPanel")
    m.emptyTitle = m.top.findNode("emptyTitle")
    m.emptyText = m.top.findNode("emptyText")
    m.results = m.top.findNode("results")

    ts = Theme_typeScale()
    Ui_setFont(m.heading, true, ts.title)
    Ui_setFont(m.queryText, true, ts.title)
    Ui_setFont(m.status, false, ts.body)
    Ui_setFont(m.hint, false, ts.caption)
    Ui_setFont(m.emptyTitle, true, ts.heading)
    Ui_setFont(m.emptyText, false, ts.body)
    m.heading.text = "Busca"
    m.hint.text = "Setas movem o foco · OK digita · Voltar sai da Busca"
    m.emptyTitle.text = "Nenhum resultado"
    m.emptyText.text = "Tente um título, um gênero (drama, fantasia) ou aplicativo."

    m.keyRows = Search_keyRows()
    m.rowLengths = Search_rowLengths()
    m.keys = []
    buildKeyboard()

    m.query = ""
    m.zone = "keys" ' "keys" ou "results"
    m.kRow = 0
    m.kCol = 0
    m.top.observeField("focusedChild", "onFocusChanged")
    m.results.observeField("rowItemSelected", "onItemSelected")
    m.global.observeFieldScoped("themeId", "applyTheme")
    applyTheme()
    refreshResults()
end sub

function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    return true
end function

' Teclado: 4 linhas de 9 teclas e uma linha com duas teclas largas.
' Largura total 747 (75 + 9 de espaço por tecla; 2 × 369 + 9 na última).
sub buildKeyboard()
    y = 0
    for r = 0 to m.keyRows.Count() - 1
        row = m.keyRows[r]
        nodes = []
        x = 0
        for c = 0 to row.Count() - 1
            key = m.keyboard.createChild("PillButton")
            key.variant = "key"
            if row.Count() = 2 then key.minWidth = 369 else key.minWidth = 75
            key.text = row[c].label
            key.translation = [x, y]
            x = x + key.width + 9
            nodes.Push(key)
        end for
        m.keys.Push(nodes)
        y = y + 75
    end for
end sub

sub applyTheme()
    theme = Ui_theme()
    m.heading.color = theme.textPrimary
    m.queryPanel.uri = theme.assets.panel
    m.queryText.color = theme.textPrimary
    m.status.color = theme.textSecondary
    m.hint.color = theme.textSecondary
    m.emptyPanel.uri = theme.assets.panel
    m.emptyTitle.color = theme.textPrimary
    m.emptyText.color = theme.textSecondary
    Ui_styleRowList(m.results)
    for each row in m.keys
        for each key in row
            key.themeId = theme.id
        end for
    end for
end sub

' Atualiza texto digitado, status e fileira de resultados/sugestões.
sub refreshResults()
    found = Search_find(m.query)
    found = Util_take(found, 12)
    m.queryText.text = m.query + "_"
    m.status.text = Search_statusText(m.query, found.Count())

    if Len(m.query) = 0 then
        rowTitle = "Sugestões"
        ids = DemoContent_layout().searchSuggestions
    else
        rowTitle = "Resultados"
        ids = found
    end if
    m.results.content = CB_rowsNode([{ title: rowTitle, ids: ids }])
    hasRows = m.results.content.getChildCount() > 0
    m.results.visible = hasRows
    m.emptyGroup.visible = not hasRows
    if not hasRows and m.zone = "results" then focusKeys()
    print "AURORA_SEARCH query=" + m.query + " results=" + found.Count().ToStr()
end sub

sub onItemSelected()
    node = CB_selectedNode(m.results, m.results.rowItemSelected)
    if node <> invalid then m.top.itemSelected = node
end sub

sub updateKeyHighlight()
    focused = m.top.isInFocusChain() and m.zone = "keys"
    for r = 0 to m.keys.Count() - 1
        for c = 0 to m.keys[r].Count() - 1
            m.keys[r][c].highlighted = focused and r = m.kRow and c = m.kCol
        end for
    end for
end sub

sub onFocusChanged()
    updateKeyHighlight()
end sub

sub focusKeys()
    m.zone = "keys"
    m.keyFocus.setFocus(true)
    updateKeyHighlight()
end sub

sub focusResults()
    m.zone = "results"
    m.results.setFocus(true)
    updateKeyHighlight()
end sub

function focusContent(_params = invalid as dynamic) as boolean
    if m.zone = "results" and m.results.visible then
        focusResults()
    else
        focusKeys()
    end if
    return true
end function

function restoreFocus(_params = invalid as dynamic) as boolean
    if m.zone = "results" then Ui_traceFocus(m.results)
    return focusContent()
end function

sub typeKey()
    key = m.keyRows[m.kRow][m.kCol]
    m.query = Search_applyKey(m.query, key)
    refreshResults()
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if m.zone = "results" then
        ' Esquerda/direita/OK são do RowList; o resto chega aqui.
        if key = "up" then
            focusKeys()
            return true
        else if key = "down" then
            return true
        end if
        return false
    end if

    ' Zona do teclado.
    if key = "OK" then
        typeKey()
        return true
    else if key = "left" or key = "right" or key = "up" or key = "down" then
        target = Nav_gridMove(m.rowLengths, m.kRow, m.kCol, key)
        if target <> invalid then
            m.kRow = target.row
            m.kCol = target.col
            updateKeyHighlight()
        else if key = "down" and m.results.visible then
            focusResults()
        else if key = "up" then
            ' Primeira linha: sobe para a barra de abas (MainScene).
            return false
        end if
        return true
    end if
    return false
end function
