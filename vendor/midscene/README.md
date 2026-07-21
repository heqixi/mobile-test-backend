# Vendored Midscene packages (built artifacts)

Used by `@mtp/domain-executor`, `@mtp/business-cowork-csv`, and
`mobile-test-frontend` via `file:` deps onto this tree.

| Dir | npm name |
|-----|----------|
| `shared` / `core` / `android` / `playground` | `@midscene/*` |
| `visualizer` | `@midscene/visualizer` (console UI) |
| `web` | `@midscene/web` (from midscene `packages/web-integration`) |

Refresh from the sibling `midscene` repo:

```bash
npm run sync:midscene
```

Then `npm install` in backend and frontend, and commit `vendor/midscene/**`.
