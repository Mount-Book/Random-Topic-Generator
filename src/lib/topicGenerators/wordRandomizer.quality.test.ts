import { describe, expect, it } from 'vitest'

import qualityCasesData from './__fixtures__/wordRandomizerQualityCases.json'
import {
  lexicon,
  resolveSlotCandidates,
  templateById,
  type TemplateDefinition,
  type WordEntry,
} from './shared'
import { generateWordRandomizerTopic } from './wordRandomizer'

type SlotCandidateCase = {
  name: string
  templateId: string
  targetSlot: string
  selectedWordIds: Record<string, string>
  acceptedWordIds?: string[]
  rejectedWordIds?: string[]
}

type QualityFixtures = {
  rejectedCases: SlotCandidateCase[]
  acceptedCases: SlotCandidateCase[]
  bannedTexts: string[]
}

const fixtures = qualityCasesData as unknown as QualityFixtures

const getTemplate = (templateId: string) => {
  const template = templateById.get(templateId)

  if (!template) {
    throw new Error(`Unknown template: ${templateId}`)
  }

  return template
}

const getSlotDefinition = (template: TemplateDefinition, slotKey: string) => {
  const slot = template.slots.find((entry) => entry.key === slotKey)

  if (!slot) {
    throw new Error(`Unknown slot "${slotKey}" for template "${template.id}"`)
  }

  return slot
}

const getWordEntry = (template: TemplateDefinition, slotKey: string, wordId: string) => {
  const slot = getSlotDefinition(template, slotKey)
  const word = lexicon[slot.category].find((entry) => entry.id === wordId)

  if (!word) {
    throw new Error(`Unknown word "${wordId}" for slot "${slotKey}" in template "${template.id}"`)
  }

  return word
}

const buildSelectedWordsForCase = (template: TemplateDefinition, selectedWordIds: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(selectedWordIds).map(([slotKey, wordId]) => [
      slotKey,
      getWordEntry(template, slotKey, wordId),
    ]),
  ) as Record<string, WordEntry>

const tryResolveCandidateIdsForCase = (fixtureCase: SlotCandidateCase) => {
  const template = getTemplate(fixtureCase.templateId)
  const targetSlot = getSlotDefinition(template, fixtureCase.targetSlot)
  const selectedWords = buildSelectedWordsForCase(template, fixtureCase.selectedWordIds)

  try {
    const resolvedCandidates = resolveSlotCandidates(
      lexicon[targetSlot.category],
      template.slotConstraints?.[fixtureCase.targetSlot],
      selectedWords,
    )

    return resolvedCandidates.map((candidate) => candidate.word.id)
  } catch {
    return null
  }
}

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const withSeed = <T,>(seed: number, callback: () => T) => {
  const originalRandom = Math.random
  Math.random = createSeededRandom(seed)

  try {
    return callback()
  } finally {
    Math.random = originalRandom
  }
}

describe('word randomizer quality fixtures', () => {
  it.each(fixtures.rejectedCases)('$name', (fixtureCase) => {
    const candidateIds = tryResolveCandidateIdsForCase(fixtureCase)

    if (!candidateIds) {
      expect(candidateIds).toBeNull()
      return
    }

    fixtureCase.rejectedWordIds?.forEach((wordId) => {
      expect(candidateIds).not.toContain(wordId)
    })
  })

  it.each(fixtures.acceptedCases)('$name', (fixtureCase) => {
    const candidateIds = tryResolveCandidateIdsForCase(fixtureCase)
    expect(candidateIds).not.toBeNull()

    fixtureCase.acceptedWordIds?.forEach((wordId) => {
      expect(candidateIds ?? []).toContain(wordId)
    })
  })

  it('does not regenerate representative bad outputs across seeded runs', () => {
    const templateIds = [...new Set(fixtures.rejectedCases.map((fixtureCase) => fixtureCase.templateId))]

    for (const templateId of templateIds) {
      for (let seed = 1; seed <= 24; seed += 1) {
        const candidate = withSeed(seed, () =>
          generateWordRandomizerTopic({
            candidateCount: 32,
            templateIdFilter: [templateId],
          }),
        )

        expect(fixtures.bannedTexts).not.toContain(candidate.text)
      }
    }
  })
})
