use std::collections::VecDeque;

use crate::watch::Change;

pub const HISTORY_LIMIT: usize = 2_000;

#[derive(Default)]
pub struct History {
    pub records: VecDeque<Change>,
    pub total: usize,
}

impl History {
    pub fn push(&mut self, change: Change) {
        self.total = self.total.saturating_add(1);
        self.records.push_front(change);
        self.records.truncate(HISTORY_LIMIT);
    }

    pub fn clear(&mut self) {
        self.records.clear();
        self.total = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::watch::ChangeKind;

    #[test]
    fn retains_newest_records_with_a_bounded_history() {
        let mut history = History::default();
        for index in 0..HISTORY_LIMIT + 5 {
            history.push(Change::new(
                ChangeKind::Created,
                vec![index.to_string().into()],
            ));
        }
        assert_eq!(history.total, HISTORY_LIMIT + 5);
        assert_eq!(history.records.len(), HISTORY_LIMIT);
        assert_eq!(
            history.records.front().unwrap().paths[0],
            std::path::PathBuf::from("2004")
        );
        assert_eq!(
            history.records.back().unwrap().paths[0],
            std::path::PathBuf::from("5")
        );
        history.clear();
        assert_eq!(history.total, 0);
        assert!(history.records.is_empty());
    }
}
