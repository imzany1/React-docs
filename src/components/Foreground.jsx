import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card'

const STORAGE_KEY = 'hover-notes-v1'
const NOTE_WIDTH = 260
const NOTE_HEIGHT = 280
const BOARD_PADDING = 10

const NOTE_PALETTE = [
  {
    key: 'butter',
    label: 'Butter',
    surface: '#fff6a8',
    border: '#e2bf5d',
    accent: '#f2a531',
    shadow: 'rgba(150, 106, 10, 0.26)',
    tape: 'rgba(255, 236, 178, 0.88)',
  },
  {
    key: 'mint',
    label: 'Mint',
    surface: '#d6f8d9',
    border: '#73bb7d',
    accent: '#3f9854',
    shadow: 'rgba(36, 118, 56, 0.2)',
    tape: 'rgba(202, 236, 205, 0.9)',
  },
  {
    key: 'blush',
    label: 'Blush',
    surface: '#ffdfe4',
    border: '#cf8f9e',
    accent: '#c04f68',
    shadow: 'rgba(159, 67, 88, 0.22)',
    tape: 'rgba(255, 214, 221, 0.9)',
  },
  {
    key: 'sky',
    label: 'Sky',
    surface: '#d9efff',
    border: '#7eaed4',
    accent: '#2f76b7',
    shadow: 'rgba(48, 102, 150, 0.24)',
    tape: 'rgba(209, 235, 255, 0.9)',
  },
]

const FALLBACK_NOTES = [
  {
    id: 'note-1',
    title: 'Ship this board',
    body: 'Add note colors, drag + drop, and make the hover feel playful.',
    colorKey: 'butter',
    pinned: true,
    x: 30,
    y: 28,
    z: 1,
    createdAt: 1,
  },
  {
    id: 'note-2',
    title: 'Quick reminder',
    body: 'Every note saves automatically in local storage.',
    colorKey: 'mint',
    pinned: false,
    x: 336,
    y: 58,
    z: 2,
    createdAt: 2,
  },
  {
    id: 'note-3',
    title: 'Team sync',
    body: 'Standup tomorrow at 10:15 AM. Bring sprint blockers.',
    colorKey: 'blush',
    pinned: false,
    x: 180,
    y: 310,
    z: 3,
    createdAt: 3,
  },
]

const cloneFallbackNotes = () => FALLBACK_NOTES.map((note) => ({ ...note }))

const normalizeNote = (note, index) => {
  if (!note || typeof note !== 'object') {
    return null
  }

  return {
    id: String(note.id || `note-${index + 1}`),
    title: String(note.title || '').slice(0, 80),
    body: String(note.body || '').slice(0, 600),
    colorKey: NOTE_PALETTE.some((tone) => tone.key === note.colorKey)
      ? note.colorKey
      : NOTE_PALETTE[0].key,
    pinned: Boolean(note.pinned),
    x: Number.isFinite(note.x) ? note.x : 30 + (index % 4) * 42,
    y: Number.isFinite(note.y) ? note.y : 30 + ((index * 2) % 5) * 38,
    z: Number.isFinite(note.z) ? note.z : index + 1,
    createdAt: Number.isFinite(note.createdAt) ? note.createdAt : index + 1,
  }
}

const readNotesFromStorage = () => {
  if (typeof window === 'undefined') {
    return cloneFallbackNotes()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return cloneFallbackNotes()
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return cloneFallbackNotes()
    }

    const normalized = parsed
      .map((note, index) => normalizeNote(note, index))
      .filter(Boolean)

    return normalized.length ? normalized : cloneFallbackNotes()
  } catch {
    return cloneFallbackNotes()
  }
}

const createNoteId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `note-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function Foreground() {
  const boardRef = useRef(null)
  const [notes, setNotes] = useState(() => readNotesFromStorage())
  const [query, setQuery] = useState('')
  const [selectedTone, setSelectedTone] = useState(NOTE_PALETTE[0].key)
  const zCounterRef = useRef(Math.max(...notes.map((note) => note.z || 1), 1) + 1)

  const clampToBoard = useCallback((x, y) => {
    const boardRect = boardRef.current?.getBoundingClientRect()
    if (!boardRect) {
      return {
        x: Math.max(BOARD_PADDING, x),
        y: Math.max(BOARD_PADDING, y),
      }
    }

    const allowedWidth = Math.max(120, boardRect.width - BOARD_PADDING * 2)
    const allowedHeight = Math.max(120, boardRect.height - BOARD_PADDING * 2)
    const noteWidth = Math.min(NOTE_WIDTH, allowedWidth)
    const noteHeight = Math.min(NOTE_HEIGHT, allowedHeight)
    const maxX = Math.max(BOARD_PADDING, boardRect.width - noteWidth - BOARD_PADDING)
    const maxY = Math.max(BOARD_PADDING, boardRect.height - noteHeight - BOARD_PADDING)

    return {
      x: Math.min(maxX, Math.max(BOARD_PADDING, x)),
      y: Math.min(maxY, Math.max(BOARD_PADDING, y)),
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncPositions = () => {
      setNotes((current) =>
        current.map((note) => ({
          ...note,
          ...clampToBoard(note.x, note.y),
        })),
      )
    }

    syncPositions()
    window.addEventListener('resize', syncPositions)
    return () => window.removeEventListener('resize', syncPositions)
  }, [clampToBoard])

  const addNote = useCallback(() => {
    setQuery('')
    setNotes((current) => {
      const indexSeed = current.length
      const start = clampToBoard(24 + (indexSeed % 5) * 40, 24 + (indexSeed % 4) * 46)

      return [
        ...current,
        {
          id: createNoteId(),
          title: 'New note',
          body: '',
          colorKey: selectedTone,
          pinned: false,
          x: start.x,
          y: start.y,
          z: zCounterRef.current++,
          createdAt: Date.now(),
        },
      ]
    })
  }, [clampToBoard, selectedTone])

  const updateNote = useCallback((noteId, updates) => {
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== noteId) {
          return note
        }

        return {
          ...note,
          ...updates,
        }
      }),
    )
  }, [])

  const moveNote = useCallback(
    (noteId, offsetX, offsetY) => {
      setNotes((current) =>
        current.map((note) => {
          if (note.id !== noteId) {
            return note
          }

          if (note.pinned) {
            return note
          }

          const nextPosition = clampToBoard(note.x + offsetX, note.y + offsetY)
          return {
            ...note,
            ...nextPosition,
            z: zCounterRef.current++,
          }
        }),
      )
    },
    [clampToBoard],
  )

  const deleteNote = useCallback((noteId) => {
    setNotes((current) => current.filter((note) => note.id !== noteId))
  }, [])

  const togglePinned = useCallback((noteId) => {
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== noteId) {
          return note
        }

        return {
          ...note,
          pinned: !note.pinned,
          z: zCounterRef.current++,
        }
      }),
    )
  }, [])

  const bringToFront = useCallback((noteId) => {
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== noteId) {
          return note
        }

        return {
          ...note,
          z: zCounterRef.current++,
        }
      }),
    )
  }, [])

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = normalizedQuery
      ? notes.filter((note) => {
          const haystack = `${note.title} ${note.body}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : notes

    return [...filtered].sort(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) || (left.z || 0) - (right.z || 0),
    )
  }, [notes, query])

  const pinnedCount = notes.filter((note) => note.pinned).length

  return (
    <section className='board-panel'>
      <div className='toolbar'>
        <div className='toolbar-search-wrap'>
          <label htmlFor='note-search' className='toolbar-label'>
            Search notes
          </label>
          <input
            id='note-search'
            className='search-field'
            type='text'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Find by title or body...'
          />
        </div>

        <div className='toolbar-actions'>
          <p className='board-stats'>{notes.length} notes - {pinnedCount} pinned</p>

          <div className='swatch-group'>
            {NOTE_PALETTE.map((tone) => (
              <button
                key={tone.key}
                type='button'
                aria-label={`Use ${tone.label} tone for new note`}
                className={`swatch ${selectedTone === tone.key ? 'active' : ''}`}
                style={{ '--swatch-color': tone.surface }}
                onClick={() => setSelectedTone(tone.key)}
              />
            ))}
          </div>

          <button type='button' className='add-note-btn' onClick={addNote}>
            + New note
          </button>
        </div>
      </div>

      <div ref={boardRef} className='note-board'>
        {visibleNotes.length ? (
          visibleNotes.map((note, index) => (
            <Card
                key={note.id}
                note={note}
                index={index}
                palette={NOTE_PALETTE}
                boardRef={boardRef}
                onBringToFront={bringToFront}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onMove={moveNote}
                onTogglePin={togglePinned}
                onColorChange={(noteId, colorKey) => updateNote(noteId, { colorKey })}
            />
          ))
        ) : (
          <div className='empty-state'>
            <p>No matching notes.</p>
            <button type='button' className='empty-reset' onClick={() => setQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Foreground
