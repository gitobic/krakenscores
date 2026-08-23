export interface SchedulePoolInput {
  id: string
  name: string
}

export interface GeneratedScheduleSlot {
  id: string
  matchNumber: number
  poolKey: string
  poolName: string
  divisionId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
}

export interface ScheduleGenerationInput {
  date: string
  startTime: string
  pools: SchedulePoolInput[]
  rounds: number
  firstMatchNumber: number
  intervalMinutes: number
  duration: number
  divisionId: string
}

const pad = (value: number) => value.toString().padStart(2, '0')

export function generateScheduleSlots(input: ScheduleGenerationInput): GeneratedScheduleSlot[] {
  if (!input.date || !/^\d{2}:\d{2}$/.test(input.startTime) || input.pools.length === 0 || input.rounds < 1) return []
  const [hour, minute] = input.startTime.split(':').map(Number)
  const start = new Date(`${input.date}T${pad(hour)}:${pad(minute)}:00`)
  const slots: GeneratedScheduleSlot[] = []

  for (let round = 0; round < input.rounds; round++) {
    const time = new Date(start.getTime() + round * input.intervalMinutes * 60000)
    input.pools.forEach((pool, poolIndex) => {
      const matchNumber = input.firstMatchNumber + round * input.pools.length + poolIndex
      slots.push({
        id: `slot-${matchNumber}-${pool.id}`,
        matchNumber,
        poolKey: pool.id,
        poolName: pool.name,
        divisionId: input.divisionId,
        scheduledDate: `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`,
        scheduledTime: `${pad(time.getHours())}:${pad(time.getMinutes())}`,
        duration: input.duration,
      })
    })
  }
  return slots
}
