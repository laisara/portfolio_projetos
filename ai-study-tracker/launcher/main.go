// Launcher do AI Engineer Study Tracker.
//
//	AI Engineer Study Tracker.exe            -> inicia (ou reutiliza) o servidor e abre o navegador
//	Fechar AI Engineer Study Tracker.exe     -> encerra o servidor com segurança (mesmo binário, outro nome)
//	... --stop | --shortcut | --status       -> modos explícitos
//
// Fica na pasta do projeto, ao lado de .venv, scripts e install.bat. Não usa PowerShell para iniciar.
package main

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	appName   = "AI Engineer Study Tracker"
	appMarker = "ai-study-tracker"
)

var (
	port    = envOr("AST_PORT", "8000")
	baseURL = "http://localhost:" + port
)

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func baseDir() string {
	if v := os.Getenv("AST_HOME"); v != "" {
		return v
	}
	exe, err := os.Executable()
	if err != nil {
		return "."
	}
	return filepath.Dir(exe)
}

// isOurApp: o servidor responde e é mesmo o tracker (não outro programa na porta).
func isOurApp() bool {
	c := http.Client{Timeout: 1500 * time.Millisecond}
	resp, err := c.Get(baseURL + "/api/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	var h struct {
		App string `json:"app"`
	}
	if json.NewDecoder(resp.Body).Decode(&h) != nil {
		return false
	}
	return h.App == appMarker
}

func portBusy() bool {
	c, err := net.DialTimeout("tcp", "127.0.0.1:"+port, 500*time.Millisecond)
	if err != nil {
		return false
	}
	c.Close()
	return true
}

func waitFor(cond func() bool, total time.Duration) bool {
	end := time.Now().Add(total)
	for time.Now().Before(end) {
		if cond() {
			return true
		}
		time.Sleep(300 * time.Millisecond)
	}
	return cond()
}

func pythonPaths(base string) (console, windowless string) {
	if v := os.Getenv("AST_PYTHON"); v != "" {
		return v, v
	}
	if runtime.GOOS == "windows" {
		return filepath.Join(base, ".venv", "Scripts", "python.exe"), filepath.Join(base, ".venv", "Scripts", "pythonw.exe")
	}
	p := filepath.Join(base, ".venv", "bin", "python")
	return p, p
}

func fileExists(p string) bool { _, err := os.Stat(p); return err == nil }

func depsOK(py string, base string) bool {
	cmd := exec.Command(py, "-c", "import fastapi, uvicorn, multipart, pydantic")
	cmd.Dir = base
	hideWindow(cmd)
	return cmd.Run() == nil
}

// runInstall executa install.bat (janela visível: pode demorar e baixar pacotes).
func runInstall(base string) error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("ambiente virtual ausente: rode install.bat no Windows")
	}
	cmd := exec.Command("cmd", "/c", "install.bat", "auto")
	cmd.Dir = base
	cmd.Stdin, cmd.Stdout, cmd.Stderr = nil, nil, nil
	return cmd.Run()
}

func tailLog(base string, n int) string {
	b, err := os.ReadFile(filepath.Join(base, "database", "server.log"))
	if err != nil {
		return ""
	}
	lines := strings.Split(strings.TrimSpace(string(b)), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return strings.Join(lines, "\n")
}

func start(base string) int {
	release, already := singleInstance()
	if already { // outro clique ainda está iniciando o servidor: só espera e abre
		if waitFor(isOurApp, 60*time.Second) {
			openBrowser(baseURL)
		}
		return 0
	}
	defer release()

	if isOurApp() {
		openBrowser(baseURL)
		return 0
	}
	if portBusy() {
		message(appName, "A porta "+port+" está ocupada por outro programa.\n\nFeche-o (ou reinicie o computador) e abra o tracker novamente.", true)
		return 1
	}

	pyConsole, pyWindowless := pythonPaths(base)
	if !fileExists(pyConsole) || !depsOK(pyConsole, base) {
		message(appName, "Primeira execução: vou preparar o ambiente (Python e pacotes).\nUma janela preta vai aparecer; aguarde até ela fechar.", false)
		if err := runInstall(base); err != nil || !fileExists(pyConsole) || !depsOK(pyConsole, base) {
			message(appName, "Não consegui preparar o ambiente.\n\nAbra install.bat para ver o motivo (provavelmente falta instalar o Python 3.10+ ou não há internet).", true)
			return 1
		}
	}

	cmd := exec.Command(pyWindowless, filepath.Join("scripts", "run.py"), "--no-browser", "--port", port)
	cmd.Dir = base
	cmd.Env = append(os.Environ(), "PYTHONUTF8=1")
	detach(cmd)
	if err := cmd.Start(); err != nil {
		message(appName, "Não foi possível iniciar o servidor:\n"+err.Error(), true)
		return 1
	}
	exited := make(chan struct{})
	go func() { cmd.Wait(); close(exited) }()

	ok := waitFor(func() bool {
		select {
		case <-exited:
			return true // morreu: sai do laço e mostra o erro abaixo
		default:
		}
		return isOurApp()
	}, 45*time.Second)
	if !ok || !isOurApp() {
		message(appName, "O servidor não respondeu.\n\nÚltimas linhas de database\\server.log:\n\n"+tailLog(base, 8), true)
		return 1
	}
	openBrowser(baseURL)
	return 0
}

func stop() int {
	if !isOurApp() {
		message(appName, "O tracker não está em execução.", false)
		return 0
	}
	req, _ := http.NewRequest("POST", baseURL+"/api/shutdown", nil)
	req.Header.Set("X-AST", "1")
	c := http.Client{Timeout: 5 * time.Second}
	if resp, err := c.Do(req); err == nil {
		resp.Body.Close()
	}
	if waitFor(func() bool { return !isOurApp() }, 10*time.Second) {
		message(appName, "Tracker encerrado.\nSeus dados estão salvos e foi feito um backup.", false)
		return 0
	}
	message(appName, "Não consegui encerrar o servidor. Tente de novo ou reinicie o computador.", true)
	return 1
}

func main() {
	base := baseDir()
	mode := "start"
	name := strings.ToLower(filepath.Base(os.Args[0]))
	if strings.Contains(name, "fechar") {
		mode = "stop"
	}
	for _, a := range os.Args[1:] {
		switch a {
		case "--stop":
			mode = "stop"
		case "--shortcut":
			mode = "shortcut"
		case "--status":
			mode = "status"
		}
	}
	switch mode {
	case "stop":
		os.Exit(stop())
	case "shortcut":
		os.Exit(makeShortcut(base))
	case "status":
		if isOurApp() {
			fmt.Println("rodando", baseURL)
		} else {
			fmt.Println("parado")
			os.Exit(1)
		}
	default:
		os.Exit(start(base))
	}
}
