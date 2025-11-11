import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TOKEN_COOKIE_NAME } from '@/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'POST');
}

async function handleRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  try {
    const pathString = path.length > 0 ? path.join('/') : '';
    const backendUrl = pathString 
      ? `${API_BASE_URL}/profile-picture/${pathString}`
      : `${API_BASE_URL}/profile-picture`;

    // Get token from cookies
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();

    // Forward request to backend with token
    const response = await fetch(backendUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    const status = response.status;

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Profile Picture API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

