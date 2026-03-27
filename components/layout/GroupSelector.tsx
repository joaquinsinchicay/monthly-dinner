'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { t } from '@/lib/t'

interface Group {
  id: string
  name: string
}

interface Props {
  groups: Group[]
}

// Scenario: Header muestra el grupo activo — label "GRUPO ACTUAL" + nombre del grupo.
// Scenario: Dropdown lista los grupos del usuario — panel flotante con todos los grupos.
// Scenario: Cambio de grupo activo — router.push al seleccionar un grupo distinto.
// Scenario: Usuario con un solo grupo — sin chevron ni dropdown.
export default function GroupSelector({ groups }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const ref = useRef<HTMLDivElement>(null)

  // Lee el grupo activo desde la URL (/dashboard/[groupId]) o usa el primero disponible
  const activeGroupId = (params?.groupId as string) ?? groups[0]?.id ?? ''
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0]
  const hasMultiple = groups.length > 1

  // Scenario: Al tocar fuera — cerrar dropdown sin acción
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Scenario: Cambio de grupo activo — redirect a /dashboard/[groupId] y cierre del dropdown
  function handleSelect(groupId: string) {
    setOpen(false)
    router.push(`/dashboard/${groupId}`)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => hasMultiple && setOpen((prev) => !prev)}
        className={`flex flex-col items-start text-left ${
          hasMultiple ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-haspopup={hasMultiple ? 'listbox' : undefined}
        aria-expanded={hasMultiple ? open : undefined}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.groupSelector.label')}
        </span>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="text-[15px] font-semibold leading-tight text-[#1c1b1b]">
            {activeGroup?.name ?? '—'}
          </span>
          {/* Scenario: Usuario con un solo grupo — sin chevron */}
          {hasMultiple && (
            <ChevronDown
              size={14}
              className={`text-[#585f6c] transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* Scenario: Dropdown lista los grupos del usuario */}
      {open && (
        <div
          role="listbox"
          aria-label="Seleccionar grupo"
          className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg bg-white shadow-[0px_8px_24px_-4px_rgba(28,27,27,0.12)]"
        >
          {groups.map((group) => (
            <button
              key={group.id}
              role="option"
              aria-selected={group.id === activeGroupId}
              onClick={() => handleSelect(group.id)}
              className={`w-full px-4 py-3 text-left text-[15px] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                group.id === activeGroupId
                  ? 'bg-[#f6f3f2] font-semibold text-[#004ac6]'
                  : 'text-[#1c1b1b] hover:bg-[#f6f3f2]'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
