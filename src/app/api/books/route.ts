import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TOKEN_COOKIE_NAME } from '@/constants';

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

async function handleRequest(
  request: NextRequest,
  method: string
) {
  try {
    const backendUrl = `${API_BASE_URL}/books`;
    
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Get token from cookies
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

    // Allow GET /api/books without token, require token for POST
    if (!token && method !== 'GET') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let bodyString: string | undefined = undefined;
    if (method === 'POST') {
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
          const text = await request.text();
          if (text && text.trim().length > 0) {
            bodyString = text;
          }
        }
      } catch (error) {
        console.error('Error reading request body for books API:', error);
        bodyString = undefined;
      }
    }

    const headers: Record<string, string> = {};
    if (bodyString) {
      headers['Content-Type'] = 'application/json';
    }
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'content-length', 'content-type', 'accept-encoding', 'accept'].includes(lowerKey)) {
        headers[key] = value;
      }
    });

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString,
    });

    const data = await response.json().catch(() => ({}));
    const status = response.status;

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Books API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

