'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderRotation } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'
import { useRouter } from 'next/navigation'

interface RotationItem {
  id: string
  user_id: string
  month: string
  profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  groupId: string
  rotation: RotationItem[]
}

function Avatar({
  name,
  avatar_url,
  isFirst,
}: {
  name: string | null
  avatar_url: string | null
  isFirst: boolean
}) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative flex-shrink-0">
      {avatar_url ? (
        <img
          src={avatar_url}
          alt={name ?? 'Avatar'}
          className={`w-9 h-9 rounded-full object-cover ${
            isFirst ? 'ring-2 ring-[#004ac6]' : ''
          }`}
        />
      ) : (
        <div
          className={`w-9 h-9 rounded-full bg-[#dce6ff] text-[#004ac6] flex items-center justify-center text-[13px] font-semibold ${
            isFirst ? 'ring-2 ring-[#004ac6]' : ''
          }`}
        >
          {initials}
        </div>
      )}
      {isFirst && (
        <span className="absolute -top-1 -right-1 bg-[#6ffbbe] text-[#003825] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          HOY
        </span>
      )}
    </div>
  )
}

interface SortableAvatarProps {
  item: RotationItem
  isFirst: boolean
  isDragging: boolean
}

function SortableAvatar({ item, isFirst, isDragging }: SortableAvatarProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.user_id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Avatar
        name={item.profile?.full_name ?? null}
        avatar_url={item.profile?.avatar_url ?? null}
        isFirst={isFirst}
      />
    </div>
  )
}

export default function SettingsRotationSection({ groupId, rotation }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(rotation)
  const [isReordering, setIsReordering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.user_id === active.id)
    const newIndex = items.findIndex((i) => i.user_id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    setItems(arrayMove(items, oldIndex, newIndex))
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const result = await reorderRotation({
      group_id: groupId,
      ordered_user_ids: items.map((i) => i.user_id),
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setIsReordering(false)
    router.refresh()
  }

  if (rotation.length === 0) {
    return (
      <section>
        <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
          PRÓXIMOS ENCUENTROS
        </div>
        <div className="mb-4">
          <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
            Rotación de <em className="text-[#004ac6] not-italic">Responsables</em>
          </h2>
        </div>
        <p className="text-[14px] text-[#585f6c]">No hay rotación configurada aún.</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        PRÓXIMOS ENCUENTROS
      </div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          Rotación de <em className="text-[#004ac6] not-italic">Responsables</em>
        </h2>
        {isReordering ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setItems(rotation)
                setIsReordering(false)
                setError(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar orden'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsReordering(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
          >
            Reordenar
          </button>
        )}
      </div>

      {/* Avatares en fila */}
      <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
        {isReordering ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.user_id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {items.map((item, index) => (
                  <div key={item.user_id} className="flex items-center gap-2">
                    <SortableAvatar
                      item={item}
                      isFirst={index === 0}
                      isDragging={activeId === item.user_id}
                    />
                    {index < items.length - 1 && (
                      <span className="text-[#585f6c] text-[16px] select-none">›</span>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {items.map((item, index) => (
              <div key={item.user_id} className="flex items-center gap-2">
                <Avatar
                  name={item.profile?.full_name ?? null}
                  avatar_url={item.profile?.avatar_url ?? null}
                  isFirst={index === 0}
                />
                {index < items.length - 1 && (
                  <span className="text-[#585f6c] text-[16px] select-none">›</span>
                )}
              </div>
            ))}
          </div>
        )}

        {isReordering && (
          <p className="mt-3 text-[12px] text-[#585f6c]">
            Arrastrá los avatares para cambiar el orden.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[13px] text-[#ba1a1a]">{error}</p>
      )}
    </section>
  )
}
