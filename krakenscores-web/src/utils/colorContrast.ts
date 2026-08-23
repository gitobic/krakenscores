function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return [255, 255, 255]
  return [0, 2, 4].map(index => Number.parseInt(value.slice(index, index + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const channels = rgb(hex).map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export function contrastRatio(first: string, second: string): number {
  const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (bright + 0.05) / (dark + 0.05)
}

export function accessibleTextColor(background: string): '#000000' | '#ffffff' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#ffffff') ? '#000000' : '#ffffff'
}
