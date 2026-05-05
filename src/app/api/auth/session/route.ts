/**
 * Session API Route
 *
 * GET /api/auth/session - Get current user session with permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getUserWithPermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const token = request.cookies.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user with permissions
    const user = await getUserWithPermissions(session.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
