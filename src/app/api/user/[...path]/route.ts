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
    const backendUrl = `${API_BASE_URL}/user/${pathString}`;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Get token from cookies
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body if it exists
    let body = null;
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      try {
        body = await request.json();
      } catch {
        // No body or invalid JSON
      }
    }

    // Forward request to backend with token
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    const status = response.status;

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

