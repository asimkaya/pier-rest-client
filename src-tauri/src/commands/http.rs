use crate::models::request::{HttpRequest, HttpResponse, RequestBody};
use std::collections::HashMap;
use std::time::Instant;

#[tauri::command]
pub async fn send_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let method: reqwest::Method = request
        .method
        .parse()
        .map_err(|_| format!("Invalid HTTP method: {}", request.method))?;

    let mut url = request.url.clone();
    if !request.query_params.is_empty() {
        let params: Vec<String> = request
            .query_params
            .iter()
            .map(|(k, v)| format!("{}={}", urlencoding::encode(k), urlencoding::encode(v)))
            .collect();
        let separator = if url.contains('?') { "&" } else { "?" };
        url = format!("{}{}{}", url, separator, params.join("&"));
    }

    let mut req_builder = client.request(method, &url);

    for (key, value) in &request.headers {
        req_builder = req_builder.header(key, value);
    }

    if let Some(body) = &request.body {
        req_builder = match body {
            RequestBody::Json(json_str) => req_builder
                .header("Content-Type", "application/json")
                .body(json_str.clone()),
            RequestBody::Raw(raw) => req_builder.body(raw.clone()),
            RequestBody::FormData(form) => {
                let mut form_data = reqwest::multipart::Form::new();
                for (key, value) in form {
                    form_data = form_data.text(key.clone(), value.clone());
                }
                req_builder.multipart(form_data)
            }
        };
    }

    if let Some(timeout_ms) = request.timeout_ms {
        req_builder = req_builder.timeout(std::time::Duration::from_millis(timeout_ms));
    }

    let start = Instant::now();
    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    let duration_ms = start.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("Unknown")
        .to_string();

    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.to_string(), v.to_string());
        }
    }

    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;
    let size_bytes = body_bytes.len() as u64;
    let body = String::from_utf8_lossy(&body_bytes).to_string();

    Ok(HttpResponse {
        status,
        status_text,
        headers,
        body,
        duration_ms,
        size_bytes,
    })
}
