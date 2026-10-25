' ==========================================================================
' main.brs — thread principal do Aurora TV.
'
' Cria a tela SceneGraph, publica o estado persistente no nó global e
' grava no registro local sempre que tema, favoritos ou animações mudam. Nenhuma
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
        animations: state.animations
        persistenceStatus: state.status
    })
    globalNode.observeField("themeId", port)
    globalNode.observeField("favorites", port)
    globalNode.observeField("animations", port)

    screen.CreateScene("MainScene")
    screen.show()

    while true
        msg = wait(0, port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent" then
            if msg.isScreenClosed() then return
        else if msgType = "roSGNodeEvent" then
            saved = Persistence_save(globalNode.themeId, globalNode.favorites, globalNode.animations)
            ' O campo é só informativo: não é observado aqui (evita laço).
            status = AppState_statusFor(saved)
            if globalNode.persistenceStatus <> status then globalNode.persistenceStatus = status
        end if
    end while
end sub
