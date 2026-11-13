//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"unsafe"
)

const (
	createNoWindow   = 0x08000000
	detachedProcess  = 0x00000008
	newProcessGroup  = 0x00000200
	mbOK, mbIconErr  = 0x0, 0x10
	mbIconInfo       = 0x40
	errorAlreadyExst = 183
)

var (
	user32      = syscall.NewLazyDLL("user32.dll")
	kernel32    = syscall.NewLazyDLL("kernel32.dll")
	procMsgBox  = user32.NewProc("MessageBoxW")
	procMutex   = kernel32.NewProc("CreateMutexW")
	procRelease = kernel32.NewProc("CloseHandle")
)

func message(title, text string, isErr bool) {
	flags := uintptr(mbOK | mbIconInfo)
	if isErr {
		flags = uintptr(mbOK | mbIconErr)
	}
	t, _ := syscall.UTF16PtrFromString(title)
	m, _ := syscall.UTF16PtrFromString(text)
	procMsgBox.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), flags)
}

func hideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
}

func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow | detachedProcess | newProcessGroup}
}

// singleInstance usa um mutex nomeado: um segundo clique durante a inicialização não cria outro servidor.
func singleInstance() (release func(), already bool) {
	name, _ := syscall.UTF16PtrFromString(`Local\AIEngineerStudyTracker.Launcher`)
	h, _, err := procMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if h == 0 {
		return func() {}, false
	}
	if errno, ok := err.(syscall.Errno); ok && errno == errorAlreadyExst {
		procRelease.Call(h)
		return func() {}, true
	}
	return func() { procRelease.Call(h) }, false
}

func openBrowser(url string) {
	cmd := exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	hideWindow(cmd)
	_ = cmd.Start()
}

// makeShortcut cria o atalho na Área de Trabalho (usa o ícone embutido no próprio .exe).
func makeShortcut(base string) int {
	exe := filepath.Join(base, appName+".exe")
	if _, err := os.Stat(exe); err != nil {
		exe, _ = os.Executable()
	}
	ps := `$d=[Environment]::GetFolderPath('Desktop');` +
		`$s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d '` + appName + `.lnk'));` +
		`$s.TargetPath='` + exe + `';$s.WorkingDirectory='` + base + `';$s.IconLocation='` + exe + `,0';` +
		`$s.Description='` + appName + `';$s.Save()`
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps)
	hideWindow(cmd)
	if err := cmd.Run(); err != nil {
		message(appName, "Não consegui criar o atalho automaticamente.\n\nClique com o botão direito em \""+appName+".exe\" > Enviar para > Área de trabalho (criar atalho).", true)
		return 1
	}
	message(appName, "Atalho criado na Área de Trabalho.", false)
	return 0
}
