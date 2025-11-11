import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from '@/constants';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'No token found' },
        { status: 401 }
      );
    }

    // Return token for Socket.IO connection
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

