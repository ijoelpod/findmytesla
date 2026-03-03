// src/components/PriceTag.jsx
// Displays a vehicle's price and optionally a change badge (up/down arrow).

export function PriceTag({ price, previousPrice }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)

  const changed = previousPrice && previousPrice !== price
  const wentDown = changed && price < previousPrice
  const wentUp   = changed && price > previousPrice
  const diff = previousPrice ? Math.abs(price - previousPrice) : 0

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-text">{formatted}</span>

      {wentDown && (
        <span className="text-xs font-semibold bg-green-800/70 text-green-300 px-2 py-0.5 rounded-full">
          ▼ ${diff.toLocaleString()}
        </span>
      )}
      {wentUp && (
        <span className="text-xs font-semibold bg-red-900/70 text-red-300 px-2 py-0.5 rounded-full">
          ▲ ${diff.toLocaleString()}
        </span>
      )}
    </div>
  )
}
