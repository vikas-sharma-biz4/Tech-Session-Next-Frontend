import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TOKEN_COOKIE_NAME } from '@/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  try {
    const pathString = path.join('/');
    const backendUrl = `${API_BASE_URL}/auth/${pathString}`;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Get request body if it exists
    let bodyString: string | undefined = undefined;
    
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      try {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const body = await request.json();
          if (body && Object.keys(body).length > 0) {
            bodyString = JSON.stringify(body);
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          const body: Record<string, string> = {};
          formData.forEach((value, key) => {
            body[key] = value.toString();
          });
          bodyString = new URLSearchParams(body).toString();
        } else {
          // Try to read as text for other content types
          const text = await request.text();
          if (text && text.trim().length > 0) {
            bodyString = text;
          }
        }
      } catch (error) {
        console.error('Error reading request body:', error);
        // If we can't read the body, don't send one
        bodyString = undefined;
      }
    }

    // Build headers for backend request
    const headers: Record<string, string> = {};
    
    // Set Content-Type - always use application/json for API calls
    if (bodyString) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Copy relevant headers from original request (excluding ones we handle specially)
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Exclude headers that shouldn't be forwarded
      if (!['host', 'connection', 'content-length', 'content-type', 'accept-encoding', 'accept'].includes(lowerKey)) {
        headers[key] = value;
      }
    });

    // Special handling for Google OAuth - don't follow redirects automatically
    const isGoogleOAuth = pathString === 'google';
    
    // Forward request to backend
    const response = await fetch(url, {
      method,
      headers,
      body: bodyString,
      redirect: isGoogleOAuth ? 'manual' : 'follow', // Don't follow redirects for OAuth
    });

    const status = response.status;

    // Handle redirects for OAuth (Google login) - backend redirects to Google
    if (status === 302 || status === 301 || status === 307 || status === 308) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // Get response data (skip for redirects)
    let data: any = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = {};
      }
    }
    
    const nextResponse = NextResponse.json(data, { status });
    
    // Set token in httpOnly cookie for login/signup responses
    if ((pathString === 'login' || pathString === 'verify-signup-otp') && data.token) {
      nextResponse.cookies.set(TOKEN_COOKIE_NAME, data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return nextResponse;
    }
    
    // Clear token cookie for logout
    if (pathString === 'logout') {
      nextResponse.cookies.delete(TOKEN_COOKIE_NAME);
      return nextResponse;
    }

    return nextResponse;
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

