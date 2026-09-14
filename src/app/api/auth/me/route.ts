import { NextResponse } from 'next/server';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      user,
      isLoggedIn: isUserLoggedIn(user),
      isApproved: isUserApproved(user),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        user: null,
        isLoggedIn: false,
        isApproved: false,
        error: error.message || 'Failed to fetch current user',
      },
      { status: 500 }
    );
  }
}
