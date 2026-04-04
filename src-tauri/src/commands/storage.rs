use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn get_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create data dir: {}", e))?;
    Ok(path)
}

#[tauri::command]
pub async fn read_json_file(app: tauri::AppHandle, relative_path: String) -> Result<String, String> {
    let data_dir = get_data_dir(&app)?;
    let file_path = data_dir.join(&relative_path);

    if !file_path.exists() {
        return Ok("null".to_string());
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", relative_path, e))
}

#[tauri::command]
pub async fn write_json_file(
    app: tauri::AppHandle,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let data_dir = get_data_dir(&app)?;
    let file_path = data_dir.join(&relative_path);

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    fs::write(&file_path, &content)
        .map_err(|e| format!("Failed to write file {}: {}", relative_path, e))
}

#[tauri::command]
pub async fn delete_json_file(app: tauri::AppHandle, relative_path: String) -> Result<(), String> {
    let data_dir = get_data_dir(&app)?;
    let file_path = data_dir.join(&relative_path);

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete file {}: {}", relative_path, e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn list_json_files(app: tauri::AppHandle, relative_dir: String) -> Result<Vec<String>, String> {
    let data_dir = get_data_dir(&app)?;
    let dir_path = data_dir.join(&relative_dir);

    if !dir_path.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", relative_dir, e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            if let Some(name) = path.file_name() {
                files.push(name.to_string_lossy().to_string());
            }
        }
    }

    Ok(files)
}
