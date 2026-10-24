' ==========================================================================
' ContentBuilder.brs — converte o catálogo demonstrativo (AAs puros de
' DemoContent.brs) em ContentNodes para RowList e telas de detalhe.
' ==========================================================================

' Cria o ContentNode de um título ou aplicativo. "extra" pode trazer
' progress e note (biblioteca demonstrativa). Devolve invalid se o id não
' existir no catálogo: quem monta fileiras ignora esses itens, então dados
' incompletos nunca derrubam a interface.
function CB_itemNode(id as dynamic, extra = invalid as dynamic) as dynamic
    item = DemoContent_safeItem(id)
    if item = invalid then return invalid
    node = CreateObject("roSGNode", "ContentNode")
    node.title = item.title
    node.description = item.synopsis
    node.HDPosterUrl = DemoContent_posterUri(id)
    progress = 0.0
    cardMeta = DemoContent_cardMeta(item)
    if extra <> invalid then
        if type(extra.progress) = "Float" or type(extra.progress) = "roFloat" or type(extra.progress) = "Double" then progress = extra.progress
        if Util_isString(extra.note) and extra.note <> "" then cardMeta = item.year.ToStr() + " · " + extra.note
    end if
    year = ""
    if item.year > 0 then year = item.year.ToStr()
    node.addFields({
        itemId: id
        kind: item.kind
        year: year
        genre: item.genre
        duration: item.duration
        meta: cardMeta
        metaFull: DemoContent_metaLine(item)
        backdrop: DemoContent_backdropUri(id)
        progress: progress
        tag: ""
    })
    return node
end function

' Linhas aceitas (todas opcionais, na ordem de verificação):
'   { title, ids: [ids] }                    ids simples
'   { title, items: [{ id, progress, note }] } com progresso fictício
' Itens inexistentes são ignorados e linhas que ficam vazias são omitidas.
function CB_rowsNode(rows as object) as object
    root = CreateObject("roSGNode", "ContentNode")
    for each row in rows
        rowNode = CreateObject("roSGNode", "ContentNode")
        rowNode.title = row.title
        if row.ids <> invalid then
            for each id in row.ids
                node = CB_itemNode(id)
                if node <> invalid then rowNode.appendChild(node)
            end for
        else if row.items <> invalid then
            for each entry in row.items
                node = CB_itemNode(entry.id, entry)
                if node <> invalid then rowNode.appendChild(node)
            end for
        end if
        if rowNode.getChildCount() > 0 then root.appendChild(rowNode)
    end for
    return root
end function

' Item selecionado de um RowList a partir de rowItemSelected [linha, coluna].
function CB_selectedNode(rowList as object, selection as object) as dynamic
    if rowList.content = invalid or type(selection) <> "roArray" then return invalid
    if selection.Count() < 2 or selection[0] = invalid or selection[1] = invalid then return invalid
    if selection[0] < 0 then return invalid
    row = rowList.content.getChild(selection[0])
    if row = invalid then return invalid
    return row.getChild(selection[1])
end function

' Kicker exibido acima do título: deixa explícito que é demonstrativo.
function CB_kicker(node as object) as string
    if node.kind = "series" then
        label = "SÉRIE"
    else if node.kind = "app" then
        label = "APLICATIVO"
    else
        label = "FILME"
    end if
    return label + "  ·  " + AppConfig().demoKicker
end function

' Rastreamento de diagnóstico no console de depuração (porta 8085 no
' aparelho; console do navegador no simulador). Usado pelo roteiro
' automatizado para verificar a restauração de foco.
sub Ui_traceFocus(rowList as object)
    node = CB_selectedNode(rowList, rowList.rowItemFocused)
    if node <> invalid then print "AURORA_FOCUS " + node.itemId
end sub
