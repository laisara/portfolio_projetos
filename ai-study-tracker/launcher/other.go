//go:build !windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"
)

// Versão não-Windows: existe só para testar a lógica do launcher (iniciar/reutilizar/encerrar) em Linux.

func message(title, text string, isErr bool) { fmt.Fprintf(os.Stderr, "[%s] %s\n", title, text) }

func hideWindow(cmd *exec.Cmd) {}

func detach(cmd *exec.Cmd) { cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true} }

func singleInstance() (func(), bool) { return func() {}, false }

func openBrowser(url string) { fmt.Println("ABRIR_NAVEGADOR", url) }

func makeShortcut(base string) int {
	fmt.Println("atalho: somente no Windows")
	return 1
}
