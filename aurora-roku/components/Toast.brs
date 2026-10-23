sub init()
    m.box = m.top.findNode("box")
    m.bg = m.top.findNode("bg")
    m.label = m.top.findNode("label")
    m.timer = m.top.findNode("timer")
    Ui_setFont(m.label, false, Theme_typeScale().body)
    m.timer.observeField("fire", "hide")
end sub

sub show()
    theme = Ui_theme()
    m.bg.uri = theme.assets.panel
    m.label.color = theme.textPrimary
    m.label.width = 0
    m.label.text = m.top.message
    w = Util_snap3(Util_min(Util_max(m.label.boundingRect().width + 96, 480), 1512))
    m.bg.width = w
    m.label.width = w
    ' Centralizado horizontalmente, acima da margem segura inferior.
    m.box.translation = [Util_snap3((1920 - w) / 2), 924]
    m.box.visible = true
    m.timer.control = "stop"
    m.timer.control = "start"
end sub

sub hide()
    m.box.visible = false
end sub
