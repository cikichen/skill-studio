#[derive(Debug, Clone, Copy)]
pub enum SyncMode {
    Auto,
    Symlink,
    Copy,
}
