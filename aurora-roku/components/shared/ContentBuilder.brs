' ==========================================================================
' ContentBuilder.brs — converte o catálogo demonstrativo (AAs puros de
' DemoContent.brs) em ContentNodes para RowList e telas de detalhe.
' ==========================================================================

' Cria o ContentNode de um título. "extra" pode trazer progress e note
' (biblioteca demonstrativa).
function CB_itemNode(id as string, extra = invalid as dynamic) as object
    item = DemoContent_items()[id]
    node = CreateObject("roSGNode", "ContentNode")
    node.title = item.title
    node.description = item.synopsis
    node.HDPosterUrl = DemoContent_posterUri(id)
    progress = 0.0
    meta = DemoContent_metaLine(item)
    if extra <> invalid then
        if extra.progress <> invalid then progress = extra.progress
        if Util_isString(extra.note) and extra.note <> "" then meta = item.year.ToStr() + " · " + extra.note
    end if
    node.addFields({
        itemId: id
        kind: item.kind
        year: item.year.ToStr()
        genre: item.genre
        duration: item.duration
        meta: meta
        backdrop: DemoContent_backdropUri(id)
        progress: progress
    })
    return node
end function

function CB_collectionNode(collection as object) as object
    node = CreateObject("roSGNode", "ContentNode")
    node.title = collection.title
    node.HDPosterUrl = DemoContent_posterUri(collection.id)
    node.addFields({
        itemId: collection.id
        kind: "collection"
        meta: DemoContent_collectionSubtitle(collection)
        target: collection.target
        targetRow: collection.row
        progress: 0.0
    })
    return node
end function

' rows: array de { title, ids } ou { title, items: [{ id, progress, note }] }
function CB_rowsNode(rows as object) as object
    root = CreateObject("roSGNode", "ContentNode")
    for each row in rows
        rowNode = root.createChild("ContentNode")
        rowNode.title = row.title
        if row.ids <> invalid then
            for each id in row.ids
                rowNode.appendChild(CB_itemNode(id))
            end for
        else if row.items <> invalid then
            for each entry in row.items
                rowNode.appendChild(CB_itemNode(entry.id, entry))
            end for
        else if row.nodes <> invalid then
            for each n in row.nodes
                rowNode.appendChild(n)
            end for
        end if
    end for
    return root
end function

' Item selecionado de um RowList a partir de rowItemSelected [linha, coluna].
function CB_selectedNode(rowList as object, selection as object) as object
    if rowList.content = invalid or selection = invalid then return invalid
    row = rowList.content.getChild(selection[0])
    if row = invalid then return invalid
    return row.getChild(selection[1])
end function

' Kicker exibido acima do título: deixa explícito que é demonstrativo.
function CB_kicker(node as object) as string
    if node.kind = "series" then
        label = "SÉRIE"
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
