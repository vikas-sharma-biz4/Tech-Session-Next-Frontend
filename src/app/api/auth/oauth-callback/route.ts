import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME, ROUTES } from '@/constants';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=oauth_failed`, request.url));
    }

    if (token && userParam) {
      // Set token in httpOnly cookie
      const newUser = searchParams.get('newUser') === 'true';
      const redirectUrl = new URL(
        newUser ? ROUTES.OAUTH_CALLBACK : ROUTES.DASHBOARD,
        request.url
      );
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('user', userParam);
      if (newUser) {
        redirectUrl.searchParams.set('newUser', 'true');
      }

      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=oauth_failed`, request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=oauth_failed`, request.url));
  }
}

