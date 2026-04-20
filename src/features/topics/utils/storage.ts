import { FAVORITES_STORAGE_KEY } from '../constants'
import type { SavedTopic } from '../types'

const normalizeSavedTopic = (savedTopic: SavedTopic): SavedTopic => ({
  ...savedTopic,
  authorName: savedTopic.authorName ?? null,
  copyPrompt: savedTopic.copyPrompt ?? savedTopic.displayPrompt ?? savedTopic.text,
})

export const loadSavedTopics = (): SavedTopic[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedTopic[]).map(normalizeSavedTopic) : []
  } catch {
    return []
  }
}

export const persistSavedTopics = (savedTopics: SavedTopic[]) => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(savedTopics))
}
