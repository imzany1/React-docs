import { useEffect, useState } from 'react'
import { motion, useDragControls, useMotionValue } from 'framer-motion'

function Card({
  note,
  index,
  boardRef,
  palette,
  noteSize,
  onBringToFront,
  onUpdate,
  onDelete,
  onMove,
  onTogglePin,
  onColorChange,
}) {
  const tone = palette.find((entry) => entry.key === note.colorKey) || palette[0]
  const focusNoteControl = (event) => {
    event.stopPropagation()
    onBringToFront(note.id)
  }
  const dragControls = useDragControls()
  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const media = window.matchMedia('(pointer: coarse)')
    const syncPointerMode = () => setIsCoarsePointer(media.matches)

    syncPointerMode()
    if (media.addEventListener) {
      media.addEventListener('change', syncPointerMode)
      return () => media.removeEventListener('change', syncPointerMode)
    }

    media.addListener(syncPointerMode)
    return () => media.removeListener(syncPointerMode)
  }, [])

  const commitDraggedPosition = () => {
    const offsetX = motionX.get()
    const offsetY = motionY.get()

    if (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5) {
      return
    }

    onMove(note.id, offsetX, offsetY)
    motionX.set(0)
    motionY.set(0)
  }

  const startDragFromHandle = (event) => {
    if (note.pinned || !isCoarsePointer) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onBringToFront(note.id)
    dragControls.start(event, { snapToCursor: false })
  }

  return (
    <motion.article
      drag={!note.pinned}
      dragListener={!isCoarsePointer}
      dragControls={dragControls}
      dragConstraints={boardRef}
      dragMomentum={true}
      dragElastic={0.28}
      dragTransition={{
        power: 0.12,
        timeConstant: 220,
        bounceStiffness: 420,
        bounceDamping: 28,
      }}
      whileDrag={{ scale: 1.03, rotate: note.pinned ? 0 : -1.2 }}
      whileHover={{
        scale: 1.03,
        rotate: note.pinned ? 0 : -1.6,
        boxShadow: `0 22px 28px ${tone.shadow}`,
      }}
      onPointerDown={() => onBringToFront(note.id)}
      onDragTransitionEnd={commitDraggedPosition}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{
        opacity: 1,
        rotate: note.pinned ? 0 : [0, -0.4, 0],
      }}
      transition={{
        opacity: { duration: 0.2, delay: index * 0.05 },
        rotate: {
          duration: 5.4 + (index % 4) * 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        scale: { type: 'spring', stiffness: 260, damping: 18 },
      }}
      className={`note-card ${note.pinned ? 'is-pinned' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: noteSize.width,
        height: noteSize.height,
        zIndex: note.z,
        x: motionX,
        y: motionY,
        '--note-bg': tone.surface,
        '--note-border': tone.border,
        '--note-accent': tone.accent,
        '--note-shadow': tone.shadow,
        '--note-tape': tone.tape,
      }}
    >
      <div className='note-top'>
        <div className='note-controls'>
          {isCoarsePointer ? (
            <button
              type='button'
              className={`drag-handle ${note.pinned ? 'is-disabled' : ''}`}
              aria-label={note.pinned ? 'Pinned notes are locked' : 'Drag note'}
              onPointerDown={startDragFromHandle}
              disabled={note.pinned}
            >
              {note.pinned ? 'Locked' : 'Drag'}
            </button>
          ) : null}

          <button
            type='button'
            className='pin-btn'
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            onPointerDown={focusNoteControl}
            onClick={() => onTogglePin(note.id)}
          >
            {note.pinned ? 'Pinned' : 'Pin'}
          </button>
        </div>

        <span className='note-meta'>{note.body.length}/600</span>
      </div>

      <input
        type='text'
        className='note-title'
        value={note.title}
        maxLength={80}
        placeholder='Untitled'
        onPointerDown={focusNoteControl}
        onFocus={() => onBringToFront(note.id)}
        onChange={(event) => onUpdate(note.id, { title: event.target.value })}
      />

      <textarea
        className='note-body'
        value={note.body}
        maxLength={600}
        placeholder='Write something...'
        onPointerDown={focusNoteControl}
        onFocus={() => onBringToFront(note.id)}
        onChange={(event) => onUpdate(note.id, { body: event.target.value })}
      />

      <div className='note-footer'>
        <div className='note-color-row'>
          {palette.map((entry) => (
            <button
              key={entry.key}
              type='button'
              className={`note-color-dot ${note.colorKey === entry.key ? 'active' : ''}`}
              style={{ '--swatch-color': entry.surface }}
              aria-label={`Set note color to ${entry.label}`}
              onPointerDown={focusNoteControl}
              onClick={() => onColorChange(note.id, entry.key)}
            />
          ))}
        </div>

        <button
          type='button'
          className='delete-btn'
          onPointerDown={focusNoteControl}
          onClick={() => onDelete(note.id)}
        >
          Delete
        </button>
      </div>
    </motion.article>
  )
}

export default Card
