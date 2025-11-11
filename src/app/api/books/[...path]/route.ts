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
    const pathString = path.length > 0 ? path.join('/') : '';
    const backendUrl = pathString 
      ? `${API_BASE_URL}/books/${pathString}`
      : `${API_BASE_URL}/books`;
    
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Get token from cookies
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

    // For protected routes (POST, PUT, DELETE, and potentially GET for specific user books)
    // We'll assume all /api/books routes require authentication for now, adjust as needed
    if (!token && (method !== 'GET' || pathString !== '')) { // Allow GET /api/books without token
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

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

