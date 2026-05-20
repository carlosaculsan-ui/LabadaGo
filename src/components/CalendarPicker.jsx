import { useState } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function buildCells(year, month) {
  // (getDay() + 6) % 7 maps Sun=0 → 6, Mon=1 → 0, so Monday lands in col 0
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function CalendarPicker({ label, value, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [yr, setYr] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())

  function prevMonth() {
    if (mo === 0) { setYr(y => y - 1); setMo(11) }
    else setMo(m => m - 1)
  }

  function nextMonth() {
    if (mo === 11) { setYr(y => y + 1); setMo(0) }
    else setMo(m => m + 1)
  }

  function pick(day) {
    const d = new Date(yr, mo, day)
    if (d < today) return
    onChange?.(d)
  }

  const isSelected = day =>
    value != null &&
    value.getFullYear() === yr &&
    value.getMonth() === mo &&
    value.getDate() === day

  const isPast = day => new Date(yr, mo, day) < today

  const isToday = day =>
    today.getFullYear() === yr &&
    today.getMonth() === mo &&
    today.getDate() === day

  const cells = buildCells(yr, mo)

  return (
    <div className="border border-[#e5e7eb] rounded-xl p-4 bg-white">
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">
          {label}
        </p>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-base leading-none"
        >
          ‹
        </button>
        <span className="font-heading font-semibold text-sm text-gray-800">
          {MONTHS[mo]} {yr}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-base leading-none"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-[10px] font-semibold text-gray-400 text-center py-1">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex justify-center">
            {day ? (
              <button
                onClick={() => pick(day)}
                disabled={isPast(day)}
                className={[
                  'w-8 h-8 text-[13px] rounded-full flex items-center justify-center transition-colors',
                  isSelected(day)
                    ? 'bg-[#1B6CA8] text-white font-semibold'
                    : isPast(day)
                      ? 'text-gray-300 cursor-not-allowed'
                      : isToday(day)
                        ? 'border border-[#1B6CA8] text-[#1B6CA8] font-semibold hover:bg-[#E8F4FD]'
                        : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {day}
              </button>
            ) : (
              <span className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
