' ==========================================================================
' main.brs — thread principal do Aurora TV.
'
' Cria a tela SceneGraph, publica o estado persistente no nó global e
' grava no registro local sempre que tema ou favoritos mudam. Nenhuma
' chamada de rede é feita.
' ==========================================================================

sub Main(_args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)

    ' Os campos globais precisam existir antes de a cena ser criada.
    state = Persistence_load()
    globalNode = screen.getGlobalNode()
    globalNode.addFields({
        themeId: state.themeId
        favorites: state.favorites
        persistenceStatus: state.status
    })
    globalNode.observeField("themeId", port)
    globalNode.observeField("favorites", port)

    screen.CreateScene("MainScene")
    screen.show()

    while true
        msg = wait(0, port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent" then
            if msg.isScreenClosed() then return
        else if msgType = "roSGNodeEvent" then
            Persistence_save(globalNode.themeId, globalNode.favorites)
        end if
    end while
end sub
