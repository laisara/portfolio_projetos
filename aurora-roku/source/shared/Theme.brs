' ==========================================================================
' Theme.brs — identidade visual centralizada.
'
' Para mudar nome, cores ou recursos gráficos da marca, altere SOMENTE
' este arquivo (e o manifest, que o Roku lê antes do app iniciar).
' Cores no formato SceneGraph "0xRRGGBBAA". Arquivo puro: usado pelos
' componentes e pelos testes.
' ==========================================================================

function AppConfig() as object
    return {
        appName: "Aurora TV"
        tagline: "Sua central de entretenimento"
        defaultThemeId: "noturna"
        ' Rótulo exibido sempre que um conteúdo é fictício.
        demoLabel: "Conteúdo demonstrativo"
        ' Versão em maiúsculas escrita à mão: UCase() com acentos não foi
        ' verificado no Roku.
        demoKicker: "CONTEÚDO DEMONSTRATIVO"
    }
end function

function Theme_ids() as object
    return ["noturna", "boreal"]
end function

function Theme_get(themeId as dynamic) as object
    themes = {
        noturna: {
            id: "noturna"
            name: "Aurora Noturna"
            background: "0x080B14FF"
            surface: "0x151B2AFF"
            surfaceRaised: "0x1E2638FF"
            textPrimary: "0xF5F7FCFF"
            textSecondary: "0xA6AEC0FF"
            accent: "0x79A9FFFF"
            onAccent: "0x080B14FF"
            scrim: "0x080B14FF"
        }
        boreal: {
            id: "boreal"
            name: "Aurora Boreal"
            background: "0x06110FFF"
            surface: "0x12201EFF"
            surfaceRaised: "0x1A2C29FF"
            textPrimary: "0xF3FAF8FF"
            textSecondary: "0x9DB5AFFF"
            accent: "0x5FD9C0FF"
            onAccent: "0x04110EFF"
            scrim: "0x06110FFF"
        }
    }
    if not Util_isString(themeId) then themeId = AppConfig().defaultThemeId
    if not themes.DoesExist(themeId) then themeId = AppConfig().defaultThemeId
    theme = themes[themeId]
    ' Imagens com cantos arredondados são pré-renderizadas por tema
    ' (tools/generate_assets.py), sem depender de tingimento em tempo real.
    base = "pkg:/images/ui/" + theme.id + "/"
    theme.assets = {
        background: "pkg:/images/backgrounds/bg_" + theme.id + ".jpg"
        pillAccent: base + "pill_accent.9.png"
        pillSurface: base + "pill_surface.9.png"
        pillAccentSmall: base + "pill_accent_sm.9.png"
        pillSurfaceSmall: base + "pill_surface_sm.9.png"
        cardFocus: base + "card_focus.9.png"
        panel: base + "panel.9.png"
        dotOn: base + "dot_on.png"
        dotOff: base + "dot_off.png"
    }
    return theme
end function

function Theme_next(themeId as dynamic) as string
    ids = Theme_ids()
    if not Util_isString(themeId) then return ids[0]
    for i = 0 to ids.Count() - 1
        if ids[i] = themeId then return ids[(i + 1) mod ids.Count()]
    end for
    return ids[0]
end function

' Escala tipográfica (pontos na resolução de design FHD 1920x1080).
' Valores múltiplos de 3, conforme a recomendação da Roku para FHD.
function Theme_typeScale() as object
    return {
        display: 84
        title: 60
        heading: 36
        body: 30
        label: 27
        caption: 24
    }
end function
