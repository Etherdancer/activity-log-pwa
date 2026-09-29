# Activity Log

[![Deploy](https://github.com/Etherdancer/activity-log-pwa/actions/workflows/deploy.yml/badge.svg)](https://github.com/Etherdancer/activity-log-pwa/actions/workflows/deploy.yml)
[![Live app](https://img.shields.io/badge/app-activity--log--pwa.pages.dev-059669)](https://activity-log-pwa.pages.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

**A private weekly activity diary for one or more people — no account, no server.**
Activity Log is an installable web app (PWA) for recording what someone did and when, on
a weekly hour-by-hour calendar. Everything is stored in the browser (IndexedDB) and works
offline. It's built for carers, families and anyone who needs a simple time log that can be
printed or shared without a cloud service.

## Features

- **Weekly calendar** (Mon–Sun, 24 h). Click an hour to add an activity; set its length as a
  duration or an end time. Overlapping activities sit side by side; activities past
  midnight are supported.
- **Several people** on one device, each with their own log. Rename or delete people; the
  selected person is remembered.
- **Share without a server:** export a person's log as a JSON file, or as a compressed link
  (the data travels inside the link's `#fragment`, which is never sent to any server).
  Importing detects conflicts (keep mine / keep imported / keep both) and skips exact duplicates.
- **Print / PDF:** any date range and hour range, one week per page, or an empty template
  to fill in by hand.
- **Croatian and English**, 24-hour or 12-hour time and matching date formats. The language
  follows your browser and is remembered.
- **Installable and offline** on Android, iOS and desktop.

## Privacy

Data never leaves the device unless you export or share it yourself. There is no backend,
analytics or tracking. "Reset app" deletes the local database.

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint      # ESLint (incl. React hooks rules)
npm run build     # type-check + production build in dist/
npm run preview   # serve the production build
```

| Path | What it is |
| --- | --- |
| `src/App.tsx` | Top bar, person selection, print flow |
| `src/components/WeeklyCalendar.tsx` | Week grid, lane layout for overlapping activities |
| `src/components/ActivityModal.tsx` | Add/edit form with overlap warning |
| `src/components/ExportModal.tsx`, `ImportResolverModal.tsx`, `ImportLinkModal.tsx` | Sharing and importing |
| `src/utils/importData.ts` | Validation of untrusted import data |
| `src/db/database.ts` | Dexie (IndexedDB) schema |
| `src/i18n.ts` | Croatian and English strings |

Pushes to `master` are linted, built and deployed to Cloudflare Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml); pull requests are checked by
[`ci.yml`](.github/workflows/ci.yml).

## License

[MIT](LICENSE) © Etherdancer
