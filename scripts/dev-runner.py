#!/usr/bin/env python3
"""
FLOVA Unified Development Service Runner
Orchestrates Frontend (React + Vite), AI STT Service (IndicConformer FastAPI),
and Public Tunnel (Cloudflare quick tunnel / localtunnel) with port collision checks,
log prefixing, real-time public tunnel link detection, and graceful Ctrl+C shutdown.
"""

import sys
import os
import signal
import socket
import subprocess
import threading
import time
import argparse
import re
import shutil

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
AI_ENGINE_DIR = os.path.join(ROOT_DIR, "ai-engine")

PORT_FRONTEND = 5173
PORT_STT = 8001

# ANSI Color codes
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_FRONTEND = "\033[36m"   # Cyan
CLR_STT = "\033[32m"        # Green
CLR_TUNNEL = "\033[33m"     # Yellow / Gold
CLR_WARN = "\033[33m"       # Yellow
CLR_ERR = "\033[31m"        # Red
CLR_INFO = "\033[35m"       # Magenta
CLR_SUCCESS = "\033[92m"    # Bright Green

CHILD_PROCESSES = []
IS_SHUTTING_DOWN = False
PUBLIC_TUNNEL_URL = None


def is_port_in_use(port: int) -> bool:
    """Checks if a local TCP port is already open/listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def get_pid_on_port(port: int):
    """Finds the PID currently holding the given port."""
    if shutil.which("ss"):
        try:
            res = subprocess.run(["ss", "-tulpn"], capture_output=True, text=True, check=False)
            for line in res.stdout.splitlines():
                if f":{port} " in line:
                    m = re.search(r"pid=(\d+)", line)
                    if m:
                        return int(m.group(1))
        except Exception:
            pass

    if shutil.which("fuser"):
        try:
            res = subprocess.run(["fuser", f"{port}/tcp"], capture_output=True, text=True, check=False)
            pids = res.stdout.strip().split()
            if pids:
                return int(pids[0])
        except Exception:
            pass

    return None


def kill_process_on_port(port: int, service_name: str):
    """Gracefully terminates a process occupying the specified port."""
    pid = get_pid_on_port(port)
    if pid:
        print(f"{CLR_WARN}[dev] Terminating existing {service_name} process on port {port} (PID: {pid})...{CLR_RESET}")
        try:
            os.kill(pid, signal.SIGTERM)
            for _ in range(20):
                time.sleep(0.1)
                if not is_port_in_use(port):
                    print(f"{CLR_SUCCESS}[dev] Port {port} freed successfully.{CLR_RESET}")
                    return True
            # Force kill if still holding
            os.kill(pid, signal.SIGKILL)
            time.sleep(0.2)
            return not is_port_in_use(port)
        except ProcessLookupError:
            return True
        except Exception as e:
            print(f"{CLR_ERR}[dev] Failed to kill PID {pid}: {e}{CLR_RESET}")
            return False
    return True


def detect_python_binary() -> str:
    """
    Locates the appropriate Python interpreter:
    1. ai-engine/.venv/bin/python
    2. .venv/bin/python
    3. sys.executable
    """
    ai_venv = os.path.join(AI_ENGINE_DIR, ".venv", "bin", "python")
    if os.path.isfile(ai_venv) and os.access(ai_venv, os.X_OK):
        return ai_venv

    root_venv = os.path.join(ROOT_DIR, ".venv", "bin", "python")
    if os.path.isfile(root_venv) and os.access(root_venv, os.X_OK):
        return root_venv

    return sys.executable


def detect_tunnel_tool():
    """
    Detects available tunneling software:
    1. cloudflared (preferred)
    2. localtunnel (fallback)
    """
    # Check cloudflared in PATH
    cf = shutil.which("cloudflared")
    if not cf:
        # Check standard user local bin
        candidates = [
            os.path.expanduser("~/.local/bin/cloudflared"),
            "/usr/local/bin/cloudflared",
            "/usr/bin/cloudflared",
        ]
        for c in candidates:
            if os.path.isfile(c) and os.access(c, os.X_OK):
                cf = c
                break

    if cf:
        return {"name": "cloudflared", "bin": cf}

    # Check localtunnel
    lt = shutil.which("lt")
    if lt:
        return {"name": "localtunnel", "bin": lt}

    npx = shutil.which("npx")
    if npx:
        return {"name": "localtunnel_npx", "bin": npx}

    return None


def verify_dependencies(python_bin: str) -> bool:
    """Verifies that both frontend and STT dependencies exist."""
    errors = []

    # Check frontend node_modules
    frontend_nm = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(frontend_nm):
        errors.append(
            f"Missing frontend dependencies: directory '{frontend_nm}' not found.\n"
            f"  Run 'make install-frontend' or 'cd frontend && npm install'."
        )

    # Check Python requirements
    try:
        res = subprocess.run(
            [python_bin, "-c", "import fastapi, uvicorn, pydantic, numpy"],
            capture_output=True,
            text=True,
            check=False
        )
        if res.returncode != 0:
            errors.append(
                f"Missing Python dependencies in interpreter '{python_bin}'.\n"
                f"  Run 'make install-stt' or install requirements from 'ai-engine/stt_service/requirements.txt'."
            )
    except Exception as e:
        errors.append(f"Failed to check Python dependencies with {python_bin}: {e}")

    if errors:
        print(f"\n{CLR_ERR}╔════════════════════════════════════════════════════════════════════════════╗{CLR_RESET}")
        print(f"{CLR_ERR}║                       DEPENDENCY CHECK FAILED                              ║{CLR_RESET}")
        print(f"{CLR_ERR}╚════════════════════════════════════════════════════════════════════════════╝{CLR_RESET}")
        for err in errors:
            print(f"{CLR_WARN}• {err}{CLR_RESET}")
        print()
        return False

    return True


def stream_logs(pipe, prefix: str, color: str):
    """Reads stdout or stderr from a process and prints with formatted prefix."""
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            clean_line = line.rstrip()
            if clean_line:
                print(f"{color}{CLR_BOLD}[{prefix}]{CLR_RESET} {clean_line}", flush=True)
    except Exception:
        pass
    finally:
        pipe.close()


def print_tunnel_banner(tunnel_url: str):
    """Displays real-time highlighted box when public tunnel URL becomes active."""
    print(f"\n{CLR_SUCCESS}╔════════════════════════════════════════════════════════════════════════════╗{CLR_RESET}")
    print(f"{CLR_SUCCESS}║                       PUBLIC TUNNEL LINK ACTIVE                            ║{CLR_RESET}")
    print(f"{CLR_SUCCESS}╚════════════════════════════════════════════════════════════════════════════╝{CLR_RESET}")
    print(f"  {CLR_BOLD}• Public URL   {CLR_RESET} : {CLR_SUCCESS}{CLR_BOLD}{tunnel_url}{CLR_RESET}")
    print(f"  {CLR_BOLD}• Target       {CLR_RESET} : http://localhost:{PORT_FRONTEND} (Frontend React + Vite)")
    print(f"  {CLR_BOLD}• Mobile & PWA {CLR_RESET} : Open on your mobile phone or share with remote reviewers.")
    print(f"{CLR_SUCCESS}──────────────────────────────────────────────────────────────────────────────{CLR_RESET}\n", flush=True)


def stream_tunnel_logs(pipe, prefix: str, color: str):
    """Reads tunnel logs, extracts public URL dynamically, and displays banner."""
    global PUBLIC_TUNNEL_URL
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            clean_line = line.rstrip()
            if not clean_line:
                continue

            # Detect Cloudflare or localtunnel URL pattern
            if not PUBLIC_TUNNEL_URL:
                m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", clean_line)
                if not m:
                    m = re.search(r"https://[a-zA-Z0-9-]+\.loca\.lt", clean_line)
                if m:
                    PUBLIC_TUNNEL_URL = m.group(0)
                    print_tunnel_banner(PUBLIC_TUNNEL_URL)

            # Skip noisy raw metric logs from cloudflared
            if "Starting metrics server" in clean_line or "ICMP proxy" in clean_line:
                continue

            print(f"{color}{CLR_BOLD}[{prefix}]{CLR_RESET} {clean_line}", flush=True)
    except Exception:
        pass
    finally:
        pipe.close()


def print_banner(frontend_url: str, stt_url: str, tunnel_tool_name: str = None):
    """Displays startup banner with service endpoints."""
    print(f"\n{CLR_INFO}╔════════════════════════════════════════════════════════════════════════════╗{CLR_RESET}")
    print(f"{CLR_INFO}║                   FLOVA LOCAL DEVELOPMENT ENVIRONMENT                      ║{CLR_RESET}")
    print(f"{CLR_INFO}╚════════════════════════════════════════════════════════════════════════════╝{CLR_RESET}")
    print(f"  {CLR_FRONTEND}• Frontend (Vite)     {CLR_RESET} : {CLR_BOLD}{frontend_url}{CLR_RESET}")
    print(f"  {CLR_STT}• STT Microservice    {CLR_RESET} : {CLR_BOLD}{stt_url}{CLR_RESET} (Health: {stt_url}/health)")
    if PUBLIC_TUNNEL_URL:
        print(f"  {CLR_TUNNEL}• Public Tunnel Link  {CLR_RESET} : {CLR_SUCCESS}{CLR_BOLD}{PUBLIC_TUNNEL_URL}{CLR_RESET}")
    elif tunnel_tool_name:
        print(f"  {CLR_TUNNEL}• Public Tunnel Link  {CLR_RESET} : {CLR_TUNNEL}Initializing {tunnel_tool_name}... (link will appear shortly){CLR_RESET}")
    else:
        print(f"  {CLR_TUNNEL}• Public Tunnel Link  {CLR_RESET} : {CLR_WARN}Disabled (use make dev or make tunnel){CLR_RESET}")
    print(f"  {CLR_INFO}• Database & Auth     {CLR_RESET} : Hosted Supabase ({CLR_BOLD}msjzkylvafuwlkkujxpv{CLR_RESET})")
    print(f"\n{CLR_BOLD}Press Ctrl+C to stop all development services cleanly.{CLR_RESET}\n", flush=True)


def shutdown_processes():
    """Cleanly terminates all spawned child processes."""
    global IS_SHUTTING_DOWN
    if IS_SHUTTING_DOWN:
        return
    IS_SHUTTING_DOWN = True

    print(f"\n{CLR_WARN}[dev] Shutting down FLOVA development services...{CLR_RESET}", flush=True)
    for p, name in CHILD_PROCESSES:
        if p.poll() is None:
            try:
                # Send SIGTERM to the process group
                pgid = os.getpgid(p.pid)
                os.killpg(pgid, signal.SIGTERM)
            except Exception:
                try:
                    p.terminate()
                except Exception:
                    pass

    # Wait up to 3 seconds for clean exit
    deadline = time.time() + 3.0
    for p, name in CHILD_PROCESSES:
        remaining = max(0.1, deadline - time.time())
        try:
            p.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            try:
                pgid = os.getpgid(p.pid)
                os.killpg(pgid, signal.SIGKILL)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass

    print(f"{CLR_SUCCESS}[dev] All development services stopped cleanly.{CLR_RESET}\n", flush=True)


def signal_handler(signum, frame):
    shutdown_processes()
    sys.exit(0)


def show_status():
    """Inspects and reports port and service health."""
    print(f"\n{CLR_BOLD}FLOVA Service Status:{CLR_RESET}")
    print("----------------------------------------------------------------------")

    # Frontend
    fe_in_use = is_port_in_use(PORT_FRONTEND)
    fe_pid = get_pid_on_port(PORT_FRONTEND) if fe_in_use else None
    fe_status = f"{CLR_SUCCESS}ONLINE{CLR_RESET} (PID: {fe_pid})" if fe_in_use else f"{CLR_WARN}OFFLINE{CLR_RESET}"
    print(f"  Frontend (Port {PORT_FRONTEND})     : {fe_status} -> http://localhost:{PORT_FRONTEND}")

    # STT Service
    stt_in_use = is_port_in_use(PORT_STT)
    stt_pid = get_pid_on_port(PORT_STT) if stt_in_use else None
    stt_health = "UNKNOWN"
    if stt_in_use:
        try:
            import urllib.request
            import json
            req = urllib.request.Request(f"http://127.0.0.1:{PORT_STT}/health", headers={"User-Agent": "FLOVA-Status"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                data = json.loads(resp.read().decode())
                stt_health = data.get("status", "ok")
        except Exception as e:
            stt_health = f"error ({e})"

    stt_status = f"{CLR_SUCCESS}ONLINE{CLR_RESET} (PID: {stt_pid}, Health: {stt_health})" if stt_in_use else f"{CLR_WARN}OFFLINE{CLR_RESET}"
    print(f"  STT Service (Port {PORT_STT})  : {stt_status} -> http://localhost:{PORT_STT}/health")

    # Local Supabase port
    sb_in_use = is_port_in_use(54321)
    sb_status = f"{CLR_SUCCESS}ONLINE{CLR_RESET}" if sb_in_use else "NOT RUNNING (Using hosted Supabase)"
    print(f"  Local Supabase (Port 54321): {sb_status}")

    # Tunnel tool
    tt = detect_tunnel_tool()
    tt_name = tt["name"] if tt else "Not installed"
    print(f"  Tunneling Helper           : {CLR_BOLD}{tt_name}{CLR_RESET}")
    print("----------------------------------------------------------------------\n")


def stop_services():
    """Kills any running processes on 5173 and 8001."""
    print(f"{CLR_BOLD}Stopping FLOVA development processes...{CLR_RESET}")
    k1 = kill_process_on_port(PORT_FRONTEND, "Frontend (Vite)")
    k2 = kill_process_on_port(PORT_STT, "STT Service (Uvicorn)")
    if k1 and k2:
        print(f"{CLR_SUCCESS}All local development ports are now free.{CLR_RESET}")
    else:
        print(f"{CLR_WARN}Some processes could not be stopped. Check with 'make dev-status'.{CLR_RESET}")


def run_tunnel_only():
    """Starts only the public tunnel process for port 5173."""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    fe_online = is_port_in_use(PORT_FRONTEND)
    if not fe_online:
        print(f"{CLR_WARN}[tunnel] Notice: Frontend is not currently running on port {PORT_FRONTEND}.{CLR_RESET}")
        print(f"{CLR_WARN}[tunnel] You can start it in another terminal with 'make frontend' or use 'make dev'.{CLR_RESET}\n")

    tool = detect_tunnel_tool()
    if not tool:
        print(f"{CLR_ERR}[tunnel] No tunneling tool found.{CLR_RESET}")
        print(f"{CLR_WARN}Please install cloudflared:\n  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared{CLR_RESET}")
        sys.exit(1)

    print(f"{CLR_TUNNEL}[tunnel] Starting public tunnel using {tool['name']} for http://127.0.0.1:{PORT_FRONTEND}...{CLR_RESET}")

    if tool["name"] == "cloudflared":
        cmd = [tool["bin"], "tunnel", "--url", f"http://127.0.0.1:{PORT_FRONTEND}"]
    elif tool["name"] == "localtunnel":
        cmd = [tool["bin"], "--port", str(PORT_FRONTEND)]
    else: # npx localtunnel
        cmd = [tool["bin"], "localtunnel", "--port", str(PORT_FRONTEND)]

    try:
        p_tunnel = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            preexec_fn=os.setsid
        )
        CHILD_PROCESSES.append((p_tunnel, "tunnel"))

        t_out = threading.Thread(target=stream_tunnel_logs, args=(p_tunnel.stdout, "tunnel", CLR_TUNNEL), daemon=True)
        t_err = threading.Thread(target=stream_tunnel_logs, args=(p_tunnel.stderr, "tunnel", CLR_TUNNEL), daemon=True)
        t_out.start()
        t_err.start()

        while True:
            time.sleep(0.5)
            ret = p_tunnel.poll()
            if ret is not None and not IS_SHUTTING_DOWN:
                print(f"{CLR_ERR}[tunnel] Tunnel exited with code {ret}.{CLR_RESET}")
                shutdown_processes()
                sys.exit(ret)
    except KeyboardInterrupt:
        shutdown_processes()
        sys.exit(0)


def run_dev(kill_existing: bool = False, enable_tunnel: bool = True):
    """Main development loop."""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    python_bin = detect_python_binary()

    if not verify_dependencies(python_bin):
        sys.exit(1)

    # Check port availability
    fe_busy = is_port_in_use(PORT_FRONTEND)
    stt_busy = is_port_in_use(PORT_STT)

    if kill_existing:
        if fe_busy:
            kill_process_on_port(PORT_FRONTEND, "Frontend")
            fe_busy = False
        if stt_busy:
            kill_process_on_port(PORT_STT, "STT Service")
            stt_busy = False

    threads = []

    # 1. Start STT Service if port not busy
    if not stt_busy:
        stt_env = os.environ.copy()
        stt_env["PYTHONPATH"] = AI_ENGINE_DIR
        stt_cmd = [
            python_bin, "-m", "uvicorn",
            "stt_service.main:app",
            "--host", "0.0.0.0",
            "--port", str(PORT_STT)
        ]
        try:
            p_stt = subprocess.Popen(
                stt_cmd,
                cwd=AI_ENGINE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                preexec_fn=os.setsid,
                env=stt_env
            )
            CHILD_PROCESSES.append((p_stt, "stt"))
            t_stt = threading.Thread(target=stream_logs, args=(p_stt.stdout, "stt", CLR_STT), daemon=True)
            t_stt.start()
            threads.append(t_stt)
        except Exception as e:
            print(f"{CLR_ERR}[dev] Failed to start STT service: {e}{CLR_RESET}")
    else:
        pid = get_pid_on_port(PORT_STT)
        print(f"{CLR_WARN}[dev] Port {PORT_STT} already in use (PID: {pid}). Connecting to existing STT service.{CLR_RESET}")

    # 2. Start Frontend if port not busy
    if not fe_busy:
        npm_bin = shutil.which("npm") or "npm"
        fe_cmd = [npm_bin, "run", "dev"]
        try:
            p_fe = subprocess.Popen(
                fe_cmd,
                cwd=FRONTEND_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                preexec_fn=os.setsid
            )
            CHILD_PROCESSES.append((p_fe, "frontend"))
            t_fe = threading.Thread(target=stream_logs, args=(p_fe.stdout, "frontend", CLR_FRONTEND), daemon=True)
            t_fe.start()
            threads.append(t_fe)
        except Exception as e:
            print(f"{CLR_ERR}[dev] Failed to start Frontend: {e}{CLR_RESET}")
    else:
        pid = get_pid_on_port(PORT_FRONTEND)
        print(f"{CLR_WARN}[dev] Port {PORT_FRONTEND} already in use (PID: {pid}). Connecting to existing Frontend.{CLR_RESET}")

    # 3. Start Public Tunnel if enabled
    tunnel_tool = detect_tunnel_tool() if enable_tunnel else None
    if enable_tunnel:
        if tunnel_tool:
            if tunnel_tool["name"] == "cloudflared":
                tunnel_cmd = [tunnel_tool["bin"], "tunnel", "--url", f"http://127.0.0.1:{PORT_FRONTEND}"]
            elif tunnel_tool["name"] == "localtunnel":
                tunnel_cmd = [tunnel_tool["bin"], "--port", str(PORT_FRONTEND)]
            else:
                tunnel_cmd = [tunnel_tool["bin"], "localtunnel", "--port", str(PORT_FRONTEND)]

            try:
                p_tun = subprocess.Popen(
                    tunnel_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    preexec_fn=os.setsid
                )
                CHILD_PROCESSES.append((p_tun, "tunnel"))
                t_tun_out = threading.Thread(target=stream_tunnel_logs, args=(p_tun.stdout, "tunnel", CLR_TUNNEL), daemon=True)
                t_tun_err = threading.Thread(target=stream_tunnel_logs, args=(p_tun.stderr, "tunnel", CLR_TUNNEL), daemon=True)
                t_tun_out.start()
                t_tun_err.start()
                threads.extend([t_tun_out, t_tun_err])
            except Exception as e:
                print(f"{CLR_WARN}[dev] Could not launch tunnel: {e}{CLR_RESET}")
        else:
            print(f"{CLR_WARN}[dev] Public tunnel helper (cloudflared/localtunnel) not found. Running local services only.{CLR_RESET}")

    print_banner(f"http://localhost:{PORT_FRONTEND}", f"http://localhost:{PORT_STT}", tunnel_tool["name"] if tunnel_tool else None)

    # Supervise child processes
    try:
        while True:
            time.sleep(0.5)
            for p, name in list(CHILD_PROCESSES):
                ret = p.poll()
                if ret is not None and not IS_SHUTTING_DOWN:
                    # If tunnel fails, do not necessarily kill frontend and STT
                    if name == "tunnel":
                        print(f"{CLR_WARN}[dev] Tunnel disconnected (code {ret}). Local services remain running.{CLR_RESET}")
                        CHILD_PROCESSES.remove((p, name))
                        continue
                    print(f"{CLR_ERR}[dev] Service '{name}' exited unexpectedly with code {ret}.{CLR_RESET}")
                    shutdown_processes()
                    sys.exit(ret)
            if not CHILD_PROCESSES:
                # If all were already running, idle and allow Ctrl+C
                time.sleep(1.0)
    except KeyboardInterrupt:
        shutdown_processes()
        sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FLOVA Development Service Runner")
    parser.add_argument("--kill-existing", "-k", action="store_true", help="Kill any existing processes on ports 5173 / 8001")
    parser.add_argument("--status", "-s", action="store_true", help="Show current service and port status")
    parser.add_argument("--stop", action="store_true", help="Stop any running services on dev ports")
    parser.add_argument("--tunnel", action="store_true", default=True, help="Enable public HTTPS tunneling link (default: true)")
    parser.add_argument("--no-tunnel", action="store_false", dest="tunnel", help="Disable public tunneling link")
    parser.add_argument("--tunnel-only", action="store_true", help="Start only the public tunnel forwarder for port 5173")

    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.stop:
        stop_services()
    elif args.tunnel_only:
        run_tunnel_only()
    else:
        run_dev(kill_existing=args.kill_existing, enable_tunnel=args.tunnel)
