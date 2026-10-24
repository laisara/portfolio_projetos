sub init()
    m.heading = m.top.findNode("heading")
    m.subheading = m.top.findNode("subheading")
    m.hint = m.top.findNode("hint")
    m.panel = m.top.findNode("panel")
    m.infoList = m.top.findNode("infoList")
    m.options = [m.top.findNode("themeOption"), m.top.findNode("animationsOption"), m.top.findNode("clearOption")]

    ts = Theme_typeScale()
    Ui_setFont(m.heading, true, ts.title)
    Ui_setFont(m.subheading, false, ts.label)
    Ui_setFont(m.hint, false, ts.caption)

    m.heading.text = "Configurações"
    m.subheading.text = AppConfig().appName + " · " + AppConfig().tagline
    m.hint.text = "A troca de tema demonstra a identidade configurável: nome, cores e imagens ficam centralizados em source/shared/Theme.brs."

    m.highlight = 0
    m.top.observeField("focusedChild", "onFocusChanged")
    m.global.observeFieldScoped("themeId", "refresh")
    m.global.observeFieldScoped("favorites", "refresh")
    m.global.observeFieldScoped("animations", "refresh")
    refresh()
end sub

sub refresh()
    theme = Ui_theme()
    m.heading.color = theme.textPrimary
    m.subheading.color = theme.textSecondary
    m.hint.color = theme.textSecondary
    m.panel.uri = theme.assets.panel
    for each option in m.options
        option.themeId = theme.id
    end for
    m.options[0].text = "Tema visual: " + theme.name
    m.options[1].text = "Animações: " + onOff(m.global.animations)
    m.options[2].text = "Limpar favoritos (" + m.global.favorites.Count().ToStr() + ")"
    buildInfo(theme)
end sub

' Painel "Sobre" + "Diagnóstico": valores lidos do aparelho em tempo de
' execução (nada é presumido sobre o modelo).
sub buildInfo(theme as object)
    while m.infoList.getChildCount() > 0
        m.infoList.removeChildIndex(0)
    end while

    app = CreateObject("roAppInfo")
    device = CreateObject("roDeviceInfo")
    os = device.GetOSVersion()
    ui = device.GetUIResolution()
    design = m.top.getScene().currentDesignResolution
    ' Se alguma API não responder, o painel mostra "—" em vez de travar.
    if type(os) <> "roAssociativeArray" then os = {}
    if type(ui) <> "roAssociativeArray" then ui = {}
    if type(design) <> "roAssociativeArray" then design = {}

    entries = [
        { section: "Sobre" }
        { label: "Aplicativo", value: AppConfig().appName }
        { label: "Versão", value: Util_str(app.GetVersion()) }
        { label: "Tema atual", value: theme.name }
        { section: "Diagnóstico" }
        { label: "Modelo do aparelho", value: Util_str(device.GetModel()) }
        { label: "Roku OS", value: Util_str(os.major) + "." + Util_str(os.minor) + "." + Util_str(os.revision) + " (build " + Util_str(os.build) + ")" }
        { label: "Interface do sistema", value: Util_str(ui.name) + " · " + Util_str(ui.width) + "x" + Util_str(ui.height) }
        { label: "Resolução de design", value: Util_str(design.resolution) + " · " + Util_str(design.width) + "x" + Util_str(design.height) }
        { label: "Animações", value: onOff(m.global.animations) }
        { label: "Favoritos salvos", value: m.global.favorites.Count().ToStr() }
        { label: "Persistência", value: Util_str(m.global.persistenceStatus) }
    ]

    y = 0
    ts = Theme_typeScale()
    for each entry in entries
        if entry.section <> invalid then
            if y > 0 then y = y + 18
            label = m.infoList.createChild("Label")
            Ui_setFont(label, true, ts.heading)
            label.color = theme.accent
            label.text = entry.section
            label.translation = [0, y]
            y = y + 54
        else
            key = m.infoList.createChild("Label")
            Ui_setFont(key, false, ts.caption)
            key.color = theme.textSecondary
            key.text = entry.label
            key.translation = [0, y]
            key.width = 300
            value = m.infoList.createChild("Label")
            Ui_setFont(value, true, ts.caption)
            value.color = theme.textPrimary
            value.text = entry.value
            value.translation = [309, y]
            value.width = 411
            y = y + 45
        end if
    end for
end sub

function dispose(_params = invalid as dynamic) as boolean
    m.global.unobserveFieldScoped("themeId")
    m.global.unobserveFieldScoped("favorites")
    m.global.unobserveFieldScoped("animations")
    return true
end function

function focusContent(_params = invalid as dynamic) as boolean
    m.top.setFocus(true)
    return true
end function

function restoreFocus(_params = invalid as dynamic) as boolean
    return focusContent()
end function

sub onFocusChanged()
    focused = m.top.isInFocusChain()
    for i = 0 to m.options.Count() - 1
        m.options[i].highlighted = focused and (i = m.highlight)
    end for
end sub

function onOff(value as dynamic) as string
    if value = true then return "ligadas"
    return "desligadas"
end function

sub activate()
    if m.highlight = 0 then
        nextId = Theme_next(m.global.themeId)
        m.global.themeId = nextId
        m.top.message = "Tema alterado para " + Theme_get(nextId).name + "."
    else if m.highlight = 1 then
        m.global.animations = not m.global.animations
        m.top.message = "Animações " + onOff(m.global.animations) + "."
    else if m.global.favorites.Count() = 0 then
        m.top.message = "Não há favoritos para limpar."
    else
        m.global.favorites = []
        m.top.message = "Favoritos removidos."
    end if
end sub

' Cima na primeira opção não é tratado: sobe para o MainScene (barra).
function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "down" then
        if m.highlight < m.options.Count() - 1 then m.highlight = m.highlight + 1
        onFocusChanged()
        return true
    else if key = "up" and m.highlight > 0 then
        m.highlight = m.highlight - 1
        onFocusChanged()
        return true
    else if key = "OK" then
        activate()
        return true
    else if key = "left" or key = "right" then
        return true
    end if
    return false
end function
