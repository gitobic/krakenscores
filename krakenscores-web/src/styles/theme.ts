/**
 * KrakenScores Design System
 *
 * Centralized style constants and utilities for consistent styling across the application.
 * Based on STYLE_GUIDE.md
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary Palette
  primary: {
    blue: '#2563eb',
    darkBlue: '#1d4ed8',
    green: '#16a34a',
    darkGreen: '#15803d',
    red: '#dc2626',
  },

  // Neutral Grays
  gray: {
    black: '#111827',      // Page titles, important data
    dark: '#374151',       // Labels, body text
    medium: '#6b7280',     // Descriptions, timestamps
    light: '#9ca3af',      // Disabled states
    border: '#d1d5db',     // Input borders
    borderLight: '#e5e7eb', // Card borders
    bg: '#f3f4f6',         // Table headers, alternating rows
    bgPage: '#f9fafb',     // Page backgrounds
  },

  // Semantic Colors
  semantic: {
    win: '#16a34a',        // Green for wins
    loss: '#dc2626',       // Red for losses
    points: '#2563eb',     // Blue for points (most important)
    neutral: '#374151',    // Gray for neutral stats
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6b7280',
  },

  // Special
  white: '#ffffff',
  transparent: 'transparent',
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',

  fontSize: {
    pageTitle: '30px',
    sectionHeading: '18px',
    cardTitle: '16px',
    buttonText: '14px',
    bodyText: '14px',
    tableHeader: '11px',
    tableBody: '13px',
    tableStat: '12px',
    formLabel: '14px',
    smallText: '12px',
    badgeText: '10px',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  // Padding
  padding: {
    tableCell: '8px 12px',
    tableCellCompact: '8px 4px',
    button: '8px 16px',
    buttonCompact: '6px 14px',
    buttonLarge: '10px 20px',
    card: '16px',
    cardLarge: '16px 20px',
    divisionHeader: '12px 20px',
    filterContainer: '16px',
  },

  // Margins
  margin: {
    section: '24px',
    element: '12px',
    label: '8px',
  },

  // Gaps
  gap: {
    inline: '8px',
    filter: '16px',
    small: '4px',
  },

  // Border Radius
  borderRadius: {
    default: '6px',
    small: '3px',
    large: '8px',
    pill: '12px',
  },
} as const

// ============================================================================
// COMPONENT STYLES
// ============================================================================

/**
 * Button Styles
 */
export const buttonStyles = {
  primary: {
    padding: spacing.padding.button,
    fontSize: typography.fontSize.buttonText,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.white,
    backgroundColor: colors.primary.blue,
    border: 'none',
    borderRadius: spacing.borderRadius.default,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  outlined: {
    padding: spacing.padding.buttonCompact,
    fontSize: '13px',
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.green,
    backgroundColor: colors.white,
    border: `2px solid ${colors.primary.green}`,
    borderRadius: spacing.borderRadius.default,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },

  navigation: {
    padding: spacing.padding.button,
    fontSize: typography.fontSize.buttonText,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray.dark,
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray.border}`,
    borderRadius: spacing.borderRadius.default,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
} as const

/**
 * Form Control Styles
 */
export const formStyles = {
  label: {
    fontSize: typography.fontSize.formLabel,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray.dark,
    whiteSpace: 'nowrap' as const,
  },

  select: {
    flex: 1,
    padding: '8px 12px',
    fontSize: typography.fontSize.buttonText,
    border: `1px solid ${colors.gray.border}`,
    borderRadius: spacing.borderRadius.default,
    backgroundColor: colors.white,
    cursor: 'pointer',
  },

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
} as const

/**
 * Table Styles
 */
export const tableStyles = {
  container: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
    fontFamily: typography.fontFamily,
  },

  header: {
    backgroundColor: colors.gray.bg,
    borderBottom: `2px solid ${colors.gray.borderLight}`,
  },

  headerCell: {
    padding: spacing.padding.tableCell,
    fontSize: typography.fontSize.tableHeader,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.gray.medium,
    textTransform: 'uppercase' as const,
  },

  bodyRow: (isEven: boolean) => ({
    backgroundColor: isEven ? colors.white : colors.gray.bgPage,
    borderBottom: `1px solid ${colors.gray.borderLight}`,
  }),

  bodyCell: {
    padding: spacing.padding.tableCell,
    fontSize: typography.fontSize.tableBody,
    whiteSpace: 'nowrap' as const,
  },
} as const

/**
 * Card/Container Styles
 */
export const containerStyles = {
  filterCard: {
    marginBottom: spacing.margin.section,
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.large,
    padding: spacing.padding.filterContainer,
    border: `1px solid ${colors.gray.borderLight}`,
  },

  divisionHeader: (divisionColor: string) => ({
    backgroundColor: divisionColor,
    padding: spacing.padding.divisionHeader,
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: spacing.gap.filter,
  }),

  divisionBadge: (divisionColor: string) => ({
    backgroundColor: divisionColor,
    color: colors.gray.black,
    padding: '2px 6px',
    borderRadius: spacing.borderRadius.small,
    fontSize: typography.fontSize.badgeText,
    fontWeight: typography.fontWeight.semiBold,
    display: 'inline-block',
    whiteSpace: 'nowrap' as const,
  }),
} as const

/**
 * Page Layout Styles
 */
export const layoutStyles = {
  pageContainer: {
    fontFamily: typography.fontFamily,
  },

  pageHeader: {
    marginBottom: spacing.margin.section,
  },

  pageTitle: {
    fontSize: typography.fontSize.pageTitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray.black,
    margin: 0,
  },

  pageDescription: {
    fontSize: '16px',
    color: colors.gray.medium,
    marginTop: spacing.margin.label,
  },

  publicHeader: {
    backgroundColor: colors.primary.blue,
    color: colors.white,
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.gap.filter,
  },
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color for standings table cells based on context
 */
export const getStandingsColor = (column: 'rank' | 'team' | 'gp' | 'win' | 'loss' | 'gf' | 'ga' | 'gd' | 'pts') => {
  switch (column) {
    case 'rank':
      return { color: colors.gray.black, fontWeight: typography.fontWeight.bold }
    case 'team':
      return { color: colors.gray.black, fontWeight: typography.fontWeight.medium }
    case 'win':
      return { color: colors.semantic.win, fontWeight: typography.fontWeight.semiBold }
    case 'loss':
      return { color: colors.semantic.loss, fontWeight: typography.fontWeight.semiBold }
    case 'gd':
      return { color: colors.semantic.neutral, fontWeight: typography.fontWeight.semiBold }
    case 'pts':
      return { color: colors.semantic.points, fontWeight: typography.fontWeight.bold }
    default:
      return { color: colors.gray.dark, fontWeight: typography.fontWeight.normal }
  }
}

/**
 * Create table column group for fixed widths
 */
export const createTableColGroup = (widths: (string | number)[]) => {
  return widths.map(width =>
    typeof width === 'number' ? `${width}px` : width
  )
}

/**
 * Merge inline styles with consistent defaults
 */
export const mergeStyles = <T extends React.CSSProperties>(
  baseStyle: T,
  overrides?: Partial<T>
): T => {
  return { ...baseStyle, ...overrides }
}

/**
 * Get hover styles for buttons
 */
export const getButtonHoverStyle = (variant: 'primary' | 'outlined' | 'navigation') => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary.darkBlue }
    case 'outlined':
      return { backgroundColor: colors.primary.green, color: colors.white }
    case 'navigation':
      return { backgroundColor: colors.gray.bgPage }
  }
}

// ============================================================================
// COLUMN WIDTHS (for fixed table layouts)
// ============================================================================

export const columnWidths = {
  matchNumber: '40px',
  time: '50px',
  pool: '45px',
  division: '70px',
  score: '60px',
  rank: '50px',
  stats: '50px',  // GP, W, L, etc.
  auto: 'auto',   // Flexible content column
} as const

// ============================================================================
// EXPORTS
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  buttonStyles,
  formStyles,
  tableStyles,
  containerStyles,
  layoutStyles,
  columnWidths,
  getStandingsColor,
  createTableColGroup,
  mergeStyles,
  getButtonHoverStyle,
} as const

export default theme
