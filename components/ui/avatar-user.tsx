import Image from 'next/image'

interface AvatarUserProps {
  avatarUrl: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_PX: Record<NonNullable<AvatarUserProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
}

const FONT_SIZE: Record<NonNullable<AvatarUserProps['size']>, string> = {
  sm: '11px',
  md: '13px',
  lg: '16px',
}

function getInitial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase()
}

export default function AvatarUser({ avatarUrl, fullName, size = 'md' }: AvatarUserProps) {
  const px = SIZE_PX[size]

  if (avatarUrl) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: px, height: px }}
      >
        <Image
          src={avatarUrl}
          alt={fullName}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: px,
        height: px,
        background: '#f6f3f2',
        color: '#1c1b1b',
        fontSize: FONT_SIZE[size],
        fontFamily: 'DM Serif Display, serif',
        fontWeight: 600,
      }}
      aria-label={fullName}
    >
      {getInitial(fullName)}
    </div>
  )
}
