# UI/UX Refactoring Plan

This plan outlines the minimal, safe, incremental changes to modernize the Aksil inventory app UI to feel more premium, minimalist, and breathable, without altering the underlying database or business logic.

## User Review Required

Please review the proposed changes below. The focus is purely on the visual and structural presentation of the frontend. No backend changes (Prisma schema, IPC handlers) will be made. The AreaChart on the Dashboard will be removed as requested.

## Proposed Changes

### 1. Global CSS & Design Tokens (`index.css`)

- **Colors & Borders**: Soften `--color-border` to `#1F1F1F` or `#222222`. Remove heavy outlines. Soften the `card` shadows to be more subtle.
- **Buttons**: Simplify `.btn-gold` to have a less aggressive gradient (or a solid premium gold `#D1AA56` with subtle hover). Make `.btn-outline` cleaner.
- **Inputs & Tables**: Improve input padding and focus rings (softer gold glow). Increase table row padding and lighten table headers for better readability.
- **Cards**: Remove the heavy top border on `.card-gold`. Standardize on a single, clean `.card` style with subtle borders and soft background contrast.

### 2. Sidebar (`Sidebar.tsx`)

- **Active State**: Replace the heavy gold gradient background for active items with a more elegant, subtle indicator (e.g., subtle surface color with a left gold accent line and gold text).
- **Spacing & Icons**: Reduce vertical padding between links. Use slightly smaller or thinner icons (`strokeWidth={1.5}`).
- **Profile Area**: Clean up the bottom profile section to feel more integrated and less separated by a hard border.

### 3. Dashboard (`Dashboard.tsx`)

- **Remove Chart**: Completely remove the large `AreaChart` and `recharts` dependency.
- **Layout**:
  - Top row: 4 minimalist stat cards.
  - Middle section: Clean, two-column layout.
    - Left column: **Ventes Récentes** (Cleaner list/table of latest transactions).
    - Right column: **Alertes de Stock** (Clean list of low stock items) + **Actions Rapides** (Quick action buttons like "Nouvelle Vente").
- **Visual Weight**: Remove excessive gold highlights from numbers. Use white for primary values and gold only for critical indicators or buttons.

### 4. Layout & Page Hierarchy (`Layout.tsx` & Page Components)

- **Layout**: Increase padding in the main content area (`p-8` -> `p-10`) for better breathability.
- **Headers**: Standardize the page headers (Title, subtitle, and primary action button aligned elegantly).
- **Products & Inventory Pages**: Replace `card-gold` grids with standard clean cards. Make labels lighter (`text-text-muted`) and values clearer.
- **Sales Page**: Simplify the cart and sales table layout. Ensure the primary CTA ("Enregistrer") is the only heavy button, while secondary actions are ghost or outline.

## Verification Plan

### Automated Tests

- Run `npm run lint` and `npm run typecheck` to ensure no unused imports remain after removing `recharts`.
- Run `npm run build` to verify production compilation.

### Manual Verification

- Start the app with `npm start` and verify:
  1. The Dashboard renders cleanly without the chart.
  2. The Sidebar highlights the active page elegantly without overpowering the design.
  3. Forms (Products, Sales, Inventory) open and function as expected with the new input styles.
  4. The overall design feels cohesive, minimalist, and "premium" (dark black background, minimal borders, gold accents only where necessary).
