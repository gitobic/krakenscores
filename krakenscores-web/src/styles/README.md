# Using the Centralized Design System

This directory contains the centralized design system for KrakenScores. Instead of hardcoding colors, fonts, and spacing throughout the application, import and use the theme constants.

## Quick Start

```tsx
import theme from '../styles/theme'
// or import specific pieces:
import { colors, typography, buttonStyles } from '../styles/theme'
```

## Why Centralize Styles?

### Before (Hardcoded)
```tsx
<button style={{
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '600',
  color: 'white',
  backgroundColor: '#2563eb',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}}>
  Click Me
</button>
```

### After (Using Theme)
```tsx
import { buttonStyles } from '../styles/theme'

<button style={buttonStyles.primary}>
  Click Me
</button>
```

### Benefits
✅ **Consistency** - All buttons use the same style
✅ **Maintainability** - Change once, updates everywhere
✅ **Type Safety** - TypeScript autocomplete and validation
✅ **Readability** - Intent is clear (`buttonStyles.primary` vs raw values)
✅ **DRY Principle** - Don't Repeat Yourself

---

## Usage Examples

### 1. Colors

```tsx
import { colors } from '../styles/theme'

// Page title
<h1 style={{ color: colors.gray.black }}>Title</h1>

// Win/Loss colors
<td style={{ color: colors.semantic.win }}>5</td>
<td style={{ color: colors.semantic.loss }}>2</td>

// Borders
<div style={{ border: `1px solid ${colors.gray.borderLight}` }}>
  Card content
</div>
```

### 2. Typography

```tsx
import { typography } from '../styles/theme'

// Page title
<h1 style={{
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize.pageTitle,
  fontWeight: typography.fontWeight.bold
}}>
  Page Title
</h1>

// Table header
<th style={{
  fontSize: typography.fontSize.tableHeader,
  fontWeight: typography.fontWeight.semiBold
}}>
  Header
</th>
```

### 3. Buttons

```tsx
import { buttonStyles, getButtonHoverStyle } from '../styles/theme'

// Primary button
<button
  style={buttonStyles.primary}
  onMouseEnter={(e) => {
    Object.assign(e.currentTarget.style, getButtonHoverStyle('primary'))
  }}
  onMouseLeave={(e) => {
    Object.assign(e.currentTarget.style, buttonStyles.primary)
  }}
>
  Save
</button>

// Outlined button (for emphasis)
<button style={buttonStyles.outlined}>
  Recalculate
</button>

// Navigation button
<button style={buttonStyles.navigation}>
  ← Back
</button>
```

### 4. Form Controls

```tsx
import { formStyles } from '../styles/theme'

// Inline dropdown with label
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <label style={formStyles.label}>
    Tournament:
  </label>
  <select style={formStyles.select}>
    <option>Select...</option>
  </select>
</div>

// Checkbox
<input type="checkbox" style={formStyles.checkbox} />
```

### 5. Tables

```tsx
import { tableStyles, getStandingsColor, columnWidths } from '../styles/theme'

// Table structure
<table style={tableStyles.container}>
  <colgroup>
    <col style={{ width: columnWidths.rank }} />
    <col style={{ width: columnWidths.auto }} />
    <col style={{ width: columnWidths.stats }} />
  </colgroup>

  <thead style={tableStyles.header}>
    <tr>
      <th style={{ ...tableStyles.headerCell, textAlign: 'center' }}>
        Rank
      </th>
    </tr>
  </thead>

  <tbody>
    {data.map((row, idx) => (
      <tr key={row.id} style={tableStyles.bodyRow(idx % 2 === 0)}>
        <td style={{
          ...tableStyles.bodyCell,
          ...getStandingsColor('rank')
        }}>
          {row.rank}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 6. Standings Table with Color Treatment

```tsx
import { getStandingsColor, tableStyles } from '../styles/theme'

<tbody>
  {standings.map((team, idx) => (
    <tr key={team.id} style={tableStyles.bodyRow(idx % 2 === 0)}>
      {/* Rank - Bold Black */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('rank'),
        textAlign: 'center'
      }}>
        {team.rank}
      </td>

      {/* Team - Medium Black */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('team')
      }}>
        {team.name}
      </td>

      {/* Wins - Green Bold */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('win'),
        textAlign: 'center'
      }}>
        {team.wins}
      </td>

      {/* Losses - Red Bold */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('loss'),
        textAlign: 'center'
      }}>
        {team.losses}
      </td>

      {/* Goal Diff - Gray Bold */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('gd'),
        textAlign: 'center'
      }}>
        {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
      </td>

      {/* Points - Blue Bold (most important) */}
      <td style={{
        ...tableStyles.bodyCell,
        ...getStandingsColor('pts'),
        textAlign: 'center'
      }}>
        {team.points}
      </td>
    </tr>
  ))}
</tbody>
```

### 7. Containers & Cards

```tsx
import { containerStyles, layoutStyles } from '../styles/theme'

// Filter card
<div style={containerStyles.filterCard}>
  {/* Filter controls */}
</div>

// Division header
<div style={containerStyles.divisionHeader(division.colorHex)}>
  <h2 style={{
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  }}>
    {division.name}
  </h2>
  <button>Action</button>
</div>

// Division badge
<div style={containerStyles.divisionBadge(division.colorHex)}>
  {division.name}
</div>
```

### 8. Page Layout

```tsx
import { layoutStyles } from '../styles/theme'

<div style={layoutStyles.pageContainer}>
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Page header */}
    <div style={layoutStyles.pageHeader}>
      <h1 style={layoutStyles.pageTitle}>
        Page Title
      </h1>
      <p style={layoutStyles.pageDescription}>
        Description text
      </p>
    </div>

    {/* Content */}
  </div>
</div>
```

---

## Advanced Usage

### Merging Styles

Use `mergeStyles` to combine base styles with custom overrides:

```tsx
import { mergeStyles, buttonStyles } from '../styles/theme'

const customButton = mergeStyles(buttonStyles.primary, {
  fontSize: '16px',
  padding: '12px 24px'
})

<button style={customButton}>Large Button</button>
```

### Custom Column Widths

```tsx
import { createTableColGroup } from '../styles/theme'

const widths = createTableColGroup([40, 50, 70, 'auto', 60])

<colgroup>
  {widths.map((width, idx) => (
    <col key={idx} style={{ width }} />
  ))}
</colgroup>
```

### Dynamic Styles

```tsx
import { colors } from '../styles/theme'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'final': return colors.primary.green
    case 'in_progress': return colors.primary.blue
    case 'cancelled': return colors.gray.medium
    default: return colors.gray.dark
  }
}

<td style={{ color: getStatusColor(match.status) }}>
  {match.status}
</td>
```

---

## Migration Strategy

### For New Components
✅ **Use theme from the start**
```tsx
import { buttonStyles, colors } from '../styles/theme'
```

### For Existing Components
You can migrate gradually:

1. **Identify repeated patterns** (e.g., all primary buttons)
2. **Replace with theme constants** one section at a time
3. **Test to ensure no visual changes**
4. **Commit incrementally**

Example migration:
```tsx
// Before
<button style={{
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '600',
  color: 'white',
  backgroundColor: '#2563eb',
  // ... more styles
}}>
  Save
</button>

// After
import { buttonStyles } from '../styles/theme'
<button style={buttonStyles.primary}>
  Save
</button>
```

---

## Best Practices

### DO ✅
- Import only what you need: `import { colors, buttonStyles } from '../styles/theme'`
- Use semantic names: `colors.semantic.win` instead of hardcoded green
- Spread theme styles first: `{ ...tableStyles.bodyCell, textAlign: 'center' }`
- Use type-safe constants: TypeScript will catch typos

### DON'T ❌
- Don't hardcode colors: `color: '#2563eb'` → Use `color: colors.primary.blue`
- Don't hardcode spacing: `padding: '8px 12px'` → Use `padding: spacing.padding.tableCell`
- Don't duplicate styles: Create a reusable style object instead
- Don't ignore the theme: Consistency matters!

---

## When to Extend the Theme

If you find yourself:
- **Repeating the same inline styles** → Add to theme
- **Creating a new component pattern** → Add to theme
- **Using a new color not in palette** → Discuss with team first
- **Needing a new spacing value** → Ensure it fits the system

### Adding New Styles

1. Open `src/styles/theme.ts`
2. Add your constant to the appropriate section
3. Export it in the theme object
4. Document usage in this README
5. Update `STYLE_GUIDE.md` with the pattern

---

## Reference

For complete design specifications, see:
- **`/STYLE_GUIDE.md`** - Complete visual design system
- **`/CLAUDE.md`** - Project architecture and domain model
- **`theme.ts`** - Source code with all constants

---

## Questions?

If you're unsure whether to use the theme or inline styles:
- **Use theme** for repeated patterns and standard components
- **Use inline** for one-off, unique positioning or layout
- **When in doubt**, check if a similar pattern exists in the theme

Happy coding! 🎨
