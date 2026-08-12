// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, RunEvent, State};

struct SidecarState {
    child: Mutex<Option<Child>>,
    port: u16,
}

fn find_free_port() -> u16 {
    if let Ok(port_str) = env::var("PORT") {
        if let Ok(p) = port_str.parse::<u16>() {
            return p;
        }
    }
    let listener = TcpListener::bind("127.0.0.1:0").expect("Failed to bind loopback");
    let port = listener.local_addr().expect("Failed to get local addr").port();
    drop(listener);
    port
}

#[tauri::command]
fn get_api_port(state: State<'_, SidecarState>) -> u16 {
    state.port
}

fn start_sidecar(app: &AppHandle) -> (Child, u16) {
    let port = find_free_port();
    println!("[Tauri] Starting workpilot-backend sidecar on port {}", port);

    // Locate sidecar binary
    let resource_dir = app.path().resource_dir().unwrap_or_else(|_| PathBuf::from("."));
    
    let target_triple = if cfg!(target_os = "windows") {
        "x86_64-pc-windows-msvc"
    } else if cfg!(target_os = "macos") {
        "x86_64-apple-darwin"
    } else {
        "x86_64-unknown-linux-gnu"
    };
    let exe_suffix = if cfg!(target_os = "windows") { ".exe" } else { "" };

    let sidecar_target_name = format!("workpilot-backend-{}{}", target_triple, exe_suffix);
    let sidecar_generic_name = format!("workpilot-backend{}", exe_suffix);

    let candidate_paths = [
        resource_dir.join(&sidecar_generic_name),
        resource_dir.join(&sidecar_target_name),
        resource_dir.join("binaries").join(&sidecar_target_name),
        resource_dir.join("binaries").join(&sidecar_generic_name),
        PathBuf::from("binaries").join(&sidecar_target_name),
        PathBuf::from("src-tauri/binaries").join(&sidecar_target_name),
        PathBuf::from("backend/dist").join(&sidecar_generic_name),
    ];

    let mut sidecar_path = candidate_paths[0].clone();
    for candidate in &candidate_paths {
        if candidate.exists() {
            sidecar_path = candidate.clone();
            break;
        }
    }

    println!("[Tauri] Using sidecar binary at: {:?}", sidecar_path);

    let mut cmd = Command::new(&sidecar_path);
    cmd.env("PORT", port.to_string())
       .env("HOST", "127.0.0.1");

    if let Ok(db_path) = env::var("WORKPILOT_DB_PATH") {
        cmd.env("WORKPILOT_DB_PATH", db_path);
    }
    if let Ok(db_dir) = env::var("WORKPILOT_DB_DIR") {
        cmd.env("WORKPILOT_DB_DIR", db_dir);
    }

    let child = cmd.spawn().expect("Failed to spawn workpilot-backend sidecar process");

    // Wait for health check (GET http://127.0.0.1:<port>/api/v1/health)
    let health_url = format!("http://127.0.0.1:{}/api/v1/health", port);
    let start_time = Instant::now();
    let timeout = Duration::from_secs(10);
    let mut is_healthy = false;

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_millis(500))
        .build()
        .unwrap_or_default();

    while start_time.elapsed() < timeout {
        if let Ok(resp) = client.get(&health_url).send() {
            if resp.status().is_success() {
                is_healthy = true;
                break;
            }
        }
        thread::sleep(Duration::from_millis(100));
    }

    if is_healthy {
        println!("[Tauri] Backend sidecar successfully passed health check on port {}", port);
    } else {
        eprintln!("[Tauri] Backend sidecar health check timed out on port {}", port);
    }

    (child, port)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let (child, port) = start_sidecar(app.handle());
            app.manage(SidecarState {
                child: Mutex::new(Some(child)),
                port,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_api_port])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            RunEvent::ExitRequested { .. } | RunEvent::Exit => {
                let state = app_handle.state::<SidecarState>();
                if let Ok(mut lock) = state.child.lock() {
                    if let Some(mut child) = lock.take() {
                        println!("[Tauri] Terminating workpilot-backend sidecar process (PID: {})...", child.id());
                        let _ = child.kill();
                        let _ = child.wait();
                        println!("[Tauri] Sidecar process terminated successfully.");
                    }
                }
            }
            _ => {}
        });
}
