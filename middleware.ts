import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/join')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    // Scenario 04 (US-02): preservar URL solicitada para restaurar contexto post re-login
    const originalPath = request.nextUrl.pathname + request.nextUrl.search
    url.searchParams.set('redirect', originalPath)
    return NextResponse.redirect(url)
  }

  // Usuario autenticado en la raíz o en /auth/login → dashboard
  if (user && (pathname === '/' || pathname === '/auth/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Persistir el último grupo visitado para el smart redirect post-login (US-01 §8)
  // Captura /dashboard/[groupId] y /dashboard/[groupId]/subrutas
  const groupMatch = pathname.match(/^\/dashboard\/([^/]+)/)
  if (user && groupMatch?.[1]) {
    supabaseResponse.cookies.set('last_group_id', groupMatch[1], {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
