use tauri::{Listener, Manager};
use tauri_nspanel::ManagerExt;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};
use window::WebviewWindowExt;

mod command;
mod window;

pub const SPOTLIGHT_LABEL: &str = "main";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Function to setup global shortcut plugin
fn setup_global_shortcut() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL), Code::Space))
        .unwrap()
        .with_handler(|app, shortcut, event| {
            if event.state == ShortcutState::Pressed
                && shortcut.matches(Modifiers::CONTROL, Code::Space)
            {
                let window = app.get_webview_window(SPOTLIGHT_LABEL).unwrap();
                let panel = app.get_webview_panel(SPOTLIGHT_LABEL).unwrap();
                if panel.is_visible() {
                    panel.order_out(None);
                } else {
                    window.center_at_cursor_monitor().unwrap();

                    panel.show();
                }
            }
        })
        .build()
}

// Function to setup spotlight panel
fn setup_spotlight_panel() -> Box<dyn FnOnce(&mut tauri::App) -> Result<(), Box<dyn std::error::Error>> + Send> {
    Box::new(move |app| {
        // Set activation poicy to Accessory to prevent the app icon from showing on the dock
        app.set_activation_policy(tauri::ActivationPolicy::Accessory);
        let handle = app.app_handle();
        let window = handle.get_webview_window(SPOTLIGHT_LABEL).unwrap();
        // Convert the window to a spotlight panel
        let panel = window.to_spotlight_panel()?;
        handle.listen(
            format!("{}_panel_did_resign_key", SPOTLIGHT_LABEL),
            move |_| {
                // Hide the panel when it's no longer the key window
                // This ensures the panel doesn't remain visible when it's not actively being used
                panel.order_out(None);
            },
        );

        Ok(())
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            command::show,
            command::hide,
        ])
        .plugin(tauri_nspanel::init())
        .setup(setup_spotlight_panel())
        // Register a global shortcut (⌘+K) to toggle the visibility of the spotlight panel
        .plugin(setup_global_shortcut())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
