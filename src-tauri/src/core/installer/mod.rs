#[derive(Debug, Clone, Copy)]
pub enum InstallStrategy {
    Auto,
    Symlink,
    Copy,
}
