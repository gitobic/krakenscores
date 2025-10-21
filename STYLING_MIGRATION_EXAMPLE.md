# Styling Migration Example

This document shows a real example of how to refactor existing components to use the centralized theme system.

## Example: Migrating a Button

### Before (Hardcoded Inline Styles)

```tsx
// src/pages/admin/Standings.tsx
<button
  onClick={() => handleRecalculate(standing.divisionId)}
  disabled={isRecalculating}
  style={{
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: isRecalculating ? '#6b7280' : '#16a34a',
    backgroundColor: 'white',
    border: isRecalculating ? '2px solid #9ca3af' : '2px solid #16a34a',
    borderRadius: '6px',
    cursor: isRecalculating ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: isRecalculating ? 0.6 : 1,
    whiteSpace: 'nowrap'
  }}
  onMouseEnter={(e) => {
    if (!isRecalculating) {
      e.currentTarget.style.backgroundColor = '#16a34a'
      e.currentTarget.style.color = 'white'
    }
  }}
  onMouseLeave={(e) => {
    if (!isRecalculating) {
      e.currentTarget.style.backgroundColor = 'white'
      e.currentTarget.style.color = '#16a34a'
    }
  }}
>
  {isRecalculating ? '⟳ Recalculating...' : '⟳ Recalculate'}
</button>
```

**Problems**:
- Colors hardcoded (`#16a34a`, `#6b7280`, etc.)
- Repeated in every file that uses similar buttons
- Hard to maintain - what if we want to change the green shade?
- Difficult to ensure consistency

### After (Using Theme)

```tsx
// src/pages/admin/Standings.tsx
import { buttonStyles, colors, getButtonHoverStyle, mergeStyles } from '../styles/theme'

const getRecalculateButtonStyle = (isRecalculating: boolean) => {
  if (isRecalculating) {
    return mergeStyles(buttonStyles.outlined, {
      color: colors.gray.medium,
      borderColor: colors.gray.light,
      opacity: 0.6,
      cursor: 'not-allowed',
    })
  }
  return buttonStyles.outlined
}

<button
  onClick={() => handleRecalculate(standing.divisionId)}
  disabled={isRecalculating}
  style={getRecalculateButtonStyle(isRecalculating)}
  onMouseEnter={(e) => {
    if (!isRecalculating) {
      Object.assign(e.currentTarget.style, getButtonHoverStyle('outlined'))
    }
  }}
  onMouseLeave={(e) => {
    if (!isRecalculating) {
      Object.assign(e.currentTarget.style, buttonStyles.outlined)
    }
  }}
>
  {isRecalculating ? '⟳ Recalculating...' : '⟳ Recalculate'}
</button>
```

**Benefits**:
✅ Colors referenced from theme
✅ Base style comes from `buttonStyles.outlined`
✅ Hover behavior uses centralized function
✅ Easy to change colors globally
✅ Type-safe with TypeScript

---

## Example: Migrating a Standings Table

### Before (Hardcoded)

```tsx
<td style={{
  padding: '8px 12px',
  fontSize: '12px',
  textAlign: 'center',
  color: '#16a34a',
  fontWeight: '600'
}}>
  {teamStanding.wins}
</td>

<td style={{
  padding: '8px 12px',
  fontSize: '12px',
  textAlign: 'center',
  color: '#dc2626',
  fontWeight: '600'
}}>
  {teamStanding.losses}
</td>

<td style={{
  padding: '8px 12px',
  fontSize: '13px',
  textAlign: 'center',
  fontWeight: '700',
  color: '#2563eb'
}}>
  {teamStanding.points}
</td>
```

### After (Using Theme)

```tsx
import { tableStyles, getStandingsColor } from '../styles/theme'

<td style={{
  ...tableStyles.bodyCell,
  ...getStandingsColor('win'),
  textAlign: 'center'
}}>
  {teamStanding.wins}
</td>

<td style={{
  ...tableStyles.bodyCell,
  ...getStandingsColor('loss'),
  textAlign: 'center'
}}>
  {teamStanding.losses}
</td>

<td style={{
  ...tableStyles.bodyCell,
  ...getStandingsColor('pts'),
  textAlign: 'center'
}}>
  {teamStanding.points}
</td>
```

**Benefits**:
✅ Semantic naming: `getStandingsColor('win')` instead of `#16a34a`
✅ Padding and base styles from `tableStyles.bodyCell`
✅ Consistent across all standings tables
✅ Change once in theme, updates everywhere

---

## Example: Migrating Form Controls

### Before

```tsx
<div>
  <label style={{
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    whiteSpace: 'nowrap'
  }}>
    Tournament:
  </label>
  <select style={{
    flex: 1,
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer'
  }}>
    <option>Select...</option>
  </select>
</div>
```

### After

```tsx
import { formStyles, spacing } from '../styles/theme'

<div style={{ display: 'flex', alignItems: 'center', gap: spacing.gap.inline }}>
  <label style={formStyles.label}>
    Tournament:
  </label>
  <select style={formStyles.select}>
    <option>Select...</option>
  </select>
</div>
```

**Benefits**:
✅ All form controls have consistent styling
✅ Gap spacing is centralized
✅ Labels match across all forms
✅ Easy to adjust all dropdowns at once

---

## Example: Migrating Page Headers

### Before

```tsx
<div style={{ marginBottom: '24px' }}>
  <h1 style={{
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0
  }}>
    Standings
  </h1>
  <p style={{
    fontSize: '16px',
    color: '#6b7280',
    marginTop: '8px'
  }}>
    View team standings by division
  </p>
</div>
```

### After

```tsx
import { layoutStyles } from '../styles/theme'

<div style={layoutStyles.pageHeader}>
  <h1 style={layoutStyles.pageTitle}>
    Standings
  </h1>
  <p style={layoutStyles.pageDescription}>
    View team standings by division
  </p>
</div>
```

**Benefits**:
✅ All page headers look identical
✅ Spacing is consistent
✅ Font sizes match design system
✅ One place to change header styling

---

## Migration Checklist

When refactoring a component to use the theme:

- [ ] Import theme at top of file: `import theme from '../styles/theme'`
- [ ] Replace hardcoded colors with `colors.*` constants
- [ ] Replace hardcoded spacing with `spacing.*` constants
- [ ] Use `buttonStyles.*` for buttons
- [ ] Use `formStyles.*` for form controls
- [ ] Use `tableStyles.*` for tables
- [ ] Use `getStandingsColor()` for standings tables
- [ ] Replace repeated inline styles with theme objects
- [ ] Test visual appearance (should be identical)
- [ ] Check hover/active states still work
- [ ] Verify responsive behavior unchanged

---

## Common Patterns

### Pattern: Filter Container
```tsx
import { containerStyles } from '../styles/theme'

<div style={containerStyles.filterCard}>
  {/* Filter controls */}
</div>
```

### Pattern: Division Header
```tsx
import { containerStyles } from '../styles/theme'

<div style={containerStyles.divisionHeader(division.colorHex)}>
  <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
    {division.name}
  </h2>
  <button>Action</button>
</div>
```

### Pattern: Table with Fixed Columns
```tsx
import { tableStyles, columnWidths, getStandingsColor } from '../styles/theme'

<table style={tableStyles.container}>
  <colgroup>
    <col style={{ width: columnWidths.rank }} />
    <col style={{ width: columnWidths.auto }} />
    <col style={{ width: columnWidths.stats }} />
  </colgroup>
  {/* ... */}
</table>
```

### Pattern: Public Page Header
```tsx
import { layoutStyles } from '../styles/theme'

<div style={layoutStyles.publicHeader}>
  {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: '60px' }} />}
  <div style={{ textAlign: 'center' }}>
    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
      Page Title
    </h1>
    <p style={{ fontSize: '14px', margin: 0 }}>
      {tournamentName}
    </p>
  </div>
</div>
```

---

## Gradual Migration Strategy

You don't need to migrate everything at once!

### Phase 1: New Features
- **All new components** use theme from the start
- Sets the pattern for the team

### Phase 2: High-Traffic Pages
- Migrate most-used pages first (Dashboard, Schedule, Standings)
- Maximum impact for effort

### Phase 3: Admin Pages
- Migrate remaining admin pages
- Tournaments, Teams, Matches, etc.

### Phase 4: Edge Cases
- Handle special cases and one-offs
- Complete the migration

---

## Testing After Migration

1. **Visual Regression**: Component should look identical
2. **Hover States**: Check all interactive elements
3. **Responsive**: Test on mobile and desktop
4. **Browser Testing**: Check Chrome, Safari, Firefox
5. **Accessibility**: Ensure colors still have sufficient contrast

---

## Need Help?

- Check `STYLE_GUIDE.md` for complete design specs
- See `src/styles/README.md` for usage examples
- Look at `theme.ts` for all available constants
- Ask the team if you're unsure about a pattern!

---

**Remember**: The goal is consistency and maintainability, not perfection. Migrate gradually and prioritize high-impact areas first!
