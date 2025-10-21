# KrakenScores Style Guide

**Version**: 1.0
**Last Updated**: 2025-01-20

This guide documents the design system for KrakenScores, ensuring consistency across all pages (admin and public).

---

## Table of Contents

1. [Typography](#typography)
2. [Colors](#colors)
3. [Spacing](#spacing)
4. [Components](#components)
5. [Layout Patterns](#layout-patterns)
6. [Division Colors](#division-colors)

---

## Typography

### Font Family
**Primary**: `system-ui, -apple-system, sans-serif`

This native font stack provides:
- **macOS/iOS**: San Francisco (SF Pro)
- **Windows**: Segoe UI
- **Android**: Roboto
- **Linux**: System default sans-serif

**Usage**: Apply to all text elements for consistency and performance.

### Font Sizes

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| Page Title | 30px | bold (700) | #111827 | Main page heading |
| Page Description | 16px | normal (400) | #6b7280 | Subtitle under page title |
| Section Heading | 18-20px | semi-bold (600) | #111827 | Division headers, card titles |
| Button Text | 13-14px | semi-bold (600) | varies | Action buttons |
| Body Text | 14px | normal (400) | #374151 | General content |
| Table Headers | 11-12px | semi-bold (600) | #6b7280 | Column headers (uppercase) |
| Table Body | 12-13px | normal/medium (400-500) | #111827/#374151 | Data cells |
| Form Labels | 14px | medium (500) | #374151 | Input labels |
| Small Text | 12px | normal (400) | #6b7280 | Timestamps, helper text |

---

## Colors

### Primary Palette

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| **Primary Blue** | #2563eb | 37, 99, 235 | Primary buttons, links, points column |
| **Dark Blue** | #1d4ed8 | 29, 78, 216 | Button hover states |
| **Success Green** | #16a34a | 22, 163, 74 | Win column, success states, recalculate button |
| **Danger Red** | #dc2626 | 220, 38, 38 | Loss column, error states, delete buttons |

### Neutral Grays

| Color Name | Hex | Usage |
|------------|-----|-------|
| **Black** | #111827 | Page titles, rank, team names, important data |
| **Dark Gray** | #374151 | Labels, body text, neutral stats |
| **Medium Gray** | #6b7280 | Descriptions, timestamps, table headers |
| **Light Gray** | #9ca3af | Disabled states, placeholder text |
| **Border Gray** | #d1d5db | Input borders, dividers |
| **Border Light** | #e5e7eb | Card borders, table borders |
| **Background Gray** | #f3f4f6 | Table headers, alternating rows |
| **Page Background** | #f9fafb | Page background, subtle backgrounds |

### Semantic Colors

| Context | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Win** | Green | #16a34a | Wins column, winning team |
| **Loss** | Red | #dc2626 | Losses column, losing team |
| **Points** | Blue | #2563eb | Points column (most important) |
| **Goal Differential** | Gray (bold) | #374151 | GD column |

---

## Spacing

### Padding Standards

#### Tables
```css
/* Table Headers */
padding: 8px 12px;  /* Compact vertical, readable horizontal */

/* Table Body Cells */
padding: 8px 12px;  /* Matches headers for alignment */

/* Empty State Messages */
padding: 24px 12px; /* More space for centered messages */
```

#### Cards & Containers
```css
/* Filter Containers */
padding: 16px;  /* Comfortable padding for controls */

/* Division Headers (Compact) */
padding: 12px 20px;  /* Reduced vertical space */

/* Card Content */
padding: 16px 20px;  /* Standard card padding */
```

#### Buttons
```css
/* Primary Buttons */
padding: 8px 16px;  /* Standard button padding */

/* Compact Buttons (outlined) */
padding: 6px 14px;  /* Slightly less for outlined style */

/* Large Buttons */
padding: 10px 20px;  /* More prominent actions */
```

### Margins

```css
/* Section Spacing */
margin-bottom: 24px;  /* Between major sections */

/* Element Spacing */
margin-bottom: 12px;  /* Between related elements */
margin-bottom: 8px;   /* Label to input */

/* Inline Spacing */
gap: 8px;   /* Between inline elements (label + dropdown) */
gap: 16px;  /* Between filter groups */
```

---

## Components

### Buttons

#### Primary Button (Filled)
```jsx
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
  Button Text
</button>

// Hover: backgroundColor: '#1d4ed8'
```

#### Outlined Button (for emphasis)
```jsx
<button style={{
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#16a34a',
  backgroundColor: 'white',
  border: '2px solid #16a34a',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap'
}}>
  Recalculate
</button>

// Hover: backgroundColor: '#16a34a', color: 'white'
```

#### Navigation Button (Back/Cancel)
```jsx
<button style={{
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  backgroundColor: 'white',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}}>
  ← Back to Dashboard
</button>

// Hover: backgroundColor: '#f9fafb'
```

### Form Controls

#### Dropdown/Select (Inline Style)
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

#### Checkbox
```jsx
<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
  <input
    type="checkbox"
    style={{
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    }}
  />
  <span style={{
    marginLeft: '8px',
    fontSize: '14px',
    color: '#374151'
  }}>
    Show full club names
  </span>
</label>
```

### Tables

#### Table Structure (Fixed Layout)
```jsx
<table style={{
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontFamily: 'system-ui, -apple-system, sans-serif'
}}>
  <colgroup>
    <col style={{ width: '40px' }} />  {/* Match # */}
    <col style={{ width: '50px' }} />  {/* Time */}
    <col style={{ width: '45px' }} />  {/* Pool */}
    <col style={{ width: '70px' }} />  {/* Division */}
    <col style={{ width: 'auto' }} />  {/* Flexible content */}
    <col style={{ width: '60px' }} />  {/* Score/Actions */}
  </colgroup>
  {/* ... */}
</table>
```

#### Table Header
```jsx
<thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
  <tr>
    <th style={{
      padding: '8px 12px',
      fontSize: '11px',
      fontWeight: '600',
      textAlign: 'center',
      color: '#6b7280',
      textTransform: 'uppercase'
    }}>
      Header
    </th>
  </tr>
</thead>
```

#### Table Body Row
```jsx
<tbody>
  <tr style={{
    backgroundColor: isEven ? '#ffffff' : '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  }}>
    <td style={{
      padding: '8px 12px',
      fontSize: '13px',
      textAlign: 'center',
      color: '#111827'
    }}>
      Data
    </td>
  </tr>
</tbody>
```

#### Standings Table Color Treatment
```jsx
{/* Rank - Bold Black */}
<td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
  {rank}
</td>

{/* Team Name - Medium Black */}
<td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
  {teamName}
</td>

{/* Wins - Green Bold */}
<td style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
  {wins}
</td>

{/* Losses - Red Bold */}
<td style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>
  {losses}
</td>

{/* Goal Differential - Gray Bold */}
<td style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
  {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
</td>

{/* Points - Blue Bold (most important) */}
<td style={{ padding: '8px 12px', fontSize: '13px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>
  {points}
</td>
```

### Cards & Containers

#### Filter Container (White Card)
```jsx
<div style={{
  marginBottom: '24px',
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #e5e7eb'
}}>
  {/* Filters content */}
</div>
```

#### Division Header (Compact Single Line)
```jsx
<div style={{
  backgroundColor: divisionColor,  // Color-blind safe color
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px'
}}>
  <h2 style={{
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    flex: 1
  }}>
    Division Name
    <span style={{
      fontSize: '12px',
      color: '#6b7280',
      marginLeft: '12px',
      fontWeight: '400'
    }}>
      Updated: {timestamp}
    </span>
  </h2>
  <button>{/* Action button */}</button>
</div>
```

#### Division Badge
```jsx
<div style={{
  backgroundColor: divisionColor,
  color: '#000000',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: '600',
  display: 'inline-block',
  whiteSpace: 'nowrap'
}}>
  Division Name
</div>
```

---

## Layout Patterns

### Page Structure

```jsx
<div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Navigation */}
    <nav style={{ marginBottom: '24px' }}>
      {/* Back button */}
    </nav>

    {/* Page Header */}
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#111827',
        margin: 0
      }}>
        Page Title
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        marginTop: '8px'
      }}>
        Page description
      </p>
    </div>

    {/* Filters */}
    <div style={{/* Filter container */}}>
      {/* Filters content */}
    </div>

    {/* Main Content */}
    <div>
      {/* Tables, cards, etc. */}
    </div>
  </div>
</div>
```

### Filter Layout (Two-Line Compact)

```jsx
<div style={{
  marginBottom: '24px',
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #e5e7eb'
}}>
  {/* First Line: Dropdowns side-by-side */}
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '12px'
  }}>
    {/* Tournament Filter */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
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
        {/* Options */}
      </select>
    </div>

    {/* Day Filter */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
      <label style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        whiteSpace: 'nowrap'
      }}>
        Filter by Day:
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
        {/* Options */}
      </select>
    </div>
  </div>

  {/* Second Line: Checkbox */}
  <div>
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
      <span style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>
        Show full club names
      </span>
    </label>
  </div>
</div>
```

### Public Page Header

```jsx
<div style={{
  backgroundColor: '#2563eb',
  color: 'white',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px'
}}>
  {/* Tournament Logo */}
  {logoUrl && (
    <img
      src={logoUrl}
      alt="Tournament Logo"
      style={{
        maxHeight: '60px',
        maxWidth: '60px',
        objectFit: 'contain'
      }}
    />
  )}

  {/* Title and Tournament Name */}
  <div style={{ textAlign: 'center' }}>
    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
      Page Title
    </h1>
    <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
      Tournament Name
    </p>
  </div>
</div>
```

---

## Division Colors

### Color-Blind Safe Palette

These colors are assigned to divisions at tournament setup and used consistently across all interfaces:

| Division | Hex | RGB | Description |
|----------|-----|-----|-------------|
| **12u CoEd** | #8DD3C7 | 141, 211, 199 | Soft teal – calm and readable |
| **13u CoEd** | #F0E442 | 240, 228, 66 | Bright gentle yellow |
| **14u CoEd** | #FDB462 | 253, 180, 98 | Warm peach-orange |
| **15u Boys** | #6A3D9A | 106, 61, 154 | Deep violet |
| **16u Boys** | #80B1D3 | 128, 177, 211 | Muted sky blue |
| **16u Girls** | #CAB2D6 | 202, 178, 214 | Muted lavender |
| **18u Boys** | #FB8072 | 251, 128, 114 | Coral red |
| **18u Girls** | #B3DE69 | 179, 222, 105 | Gentle yellow-green |
| **1st Place** | #FFD700 | 255, 215, 0 | True Gold |
| **2nd Place** | #C0C0C0 | 192, 192, 192 | Platinum Silver |
| **3rd Place** | #CD7F32 | 205, 127, 50 | Bronze |
| **Final / Championship** | #E69F00 | 230, 159, 0 | Royal Gold |
| **Mens Open** | #009E73 | 0, 158, 115 | Strong teal-green |
| **Semi-Final** | #0072B2 | 0, 114, 178 | Electric Blue |
| **Womens Open** | #EE95A8 | 238, 149, 168 | Rosy pink |

**Additional Colors Available**: See CLAUDE.md for full 27-color palette

**Usage Guidelines**:
- Always use black text (#000000) on division color backgrounds
- Division badges should use 10-11px font size
- Division headers should be 18-20px font size
- Colors should remain consistent across admin and public pages

---

## Best Practices

### DO ✅
- Use system-ui font stack for all text
- Apply color treatment to standings tables (green wins, red losses, blue points)
- Use 8px vertical padding in tables for compact spacing
- Keep division headers to single line (name + timestamp inline)
- Use outlined buttons for emphasis (recalculate, etc.)
- Apply fixed table layouts with explicit column widths
- Use inline labels with dropdowns for space efficiency
- Maintain consistent border radius (6px for most elements)

### DON'T ❌
- Don't use custom web fonts (slower performance)
- Don't use more than 12px vertical padding in table cells
- Don't put division name and timestamp on separate lines
- Don't use filled buttons for all actions (use outlined for emphasis)
- Don't use auto table layout (columns won't align across sections)
- Don't put labels above dropdowns (wastes vertical space)
- Don't mix border radius values arbitrarily

### Accessibility
- Ensure sufficient color contrast (all colors pass WCAG AA)
- Use semantic HTML where possible
- Provide hover states for interactive elements
- Use clear, descriptive labels for form controls
- Maintain touch-friendly tap targets (minimum 44x44px for mobile)

---

## Responsive Design

### Mobile-First Approach
- Design for mobile screens first (320px+)
- Use flexible layouts that adapt to larger screens
- Ensure tables are scrollable horizontally on small screens
- Keep touch targets at least 44x44px
- Use compact spacing on mobile (8px padding in tables)

### Breakpoints
```css
/* Mobile: < 640px (base styles) */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */
```

### Mobile Optimizations
- Hamburger menu for public page navigation
- Cozy table layouts with minimal padding
- Single-column filter layouts on narrow screens
- Flexible filter groups with `flex: 1 1 300px` for wrapping

---

## Version History

### Version 1.0 (2025-01-20)
- Initial style guide creation
- Documented typography, colors, spacing, and components
- Added layout patterns and division colors
- Included best practices and accessibility guidelines

---

## Contributing

When adding new features or updating existing pages:

1. **Refer to this guide first** before implementing styles
2. **Match existing patterns** for consistency
3. **Use inline styles** for custom components (avoids Tailwind conflicts)
4. **Document new patterns** if creating something unique
5. **Update this guide** when establishing new standards

---

## Questions?

For questions about the style guide or design decisions, refer to:
- `CLAUDE.md` - Project overview and architecture
- `TECHNICAL_SPEC_FIREBASE.md` - Technical implementation details
- Design reference images in `/ref_images/` directory
