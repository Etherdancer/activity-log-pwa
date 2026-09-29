# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-09-29

### Fixed
- Export after switching person exported the previously selected person's activities.
- Importing the same data twice created duplicate activities.
- Import links and files are now validated: malformed entries are dropped and unknown fields
  are ignored (share links can be crafted by anyone).
- "Keep device version" during an import conflict could still import the conflicting entries
  when they had no id.
- Import links opened while the app was already open in the tab were ignored.
- Activities that run past midnight overflowed the day column; overlapping activities were
  drawn on top of each other (now shown side by side).
- An end time equal to the start time saved an invisible zero-length activity.
- In English, the "Date" and "Time" labels showed raw keys.
- The date picker couldn't show years more than two years away, so older entries opened with
  the wrong year.
- Deleting a person could leave orphaned activities if interrupted (now one transaction).
- The language and selected person were forgotten on reload.
- Print defaulted to the first person instead of the one being viewed.

### Added
- Enter to save in the activity dialog; "Today" button in the week view.
- Error message when saving fails; validation hint for the print hour range.
- CI for pull requests; lint step before deploying; changelog and security policy.

### Changed
- Lint is clean (no `any`, no state updates inside effects).

## [1.0.0] - 2026-09-21

- Initial public release.
