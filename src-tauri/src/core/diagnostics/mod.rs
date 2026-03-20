#[derive(Debug, Clone)]
pub struct HealthReport {
    pub status: String,
    pub details: Vec<String>,
}
