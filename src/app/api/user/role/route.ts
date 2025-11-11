import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['buyer', 'seller', 'admin'].includes(role)) {
      return NextResponse.json({ message: 'Valid role is required' }, { status: 400 });
    }

    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Proxy request to backend
    const response = await fetch(`${API_BASE_URL}/user/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

