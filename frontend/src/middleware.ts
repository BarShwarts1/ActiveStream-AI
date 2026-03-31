import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  const isPublicRoute = req.nextUrl.pathname === '/login';
  
  // Root Redirect
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL(session ? '/dashboard' : '/login', req.url));
  }

  if (!session && !isPublicRoute) {
    if (!req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.includes('.')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
