// src/components/HeartButton.jsx
// The heart/save toggle button on each vehicle card.
// If the user is not logged in, clicking opens the auth modal instead.

import { Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'

export function HeartButton({ vin, onRequireAuth }) {
  const { user } = useAuth()
  const { favorites, toggleFavorite } = useFavorites()
  const isHearted = favorites.has(vin)

  function handleClick(e) {
    e.stopPropagation()   // don't trigger card click / page navigation
    if (!user) {
      onRequireAuth?.()   // tell parent to open the login modal
      return
    }
    toggleFavorite(vin)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isHearted ? 'Remove from watchlist' : 'Add to watchlist'}
      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
    >
      <Heart
        size={20}
        className={
          isHearted
            ? 'fill-accent stroke-accent'
            : 'stroke-text fill-transparent'
        }
      />
    </button>
  )
}
