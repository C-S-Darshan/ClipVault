import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserLoggedIn } from '@/lib/auth';
import { updateUserProfile, getUserStats } from '@/lib/data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!isUserLoggedIn(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getUserStats(user.id);

    return NextResponse.json({
      success: true,
      user,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!isUserLoggedIn(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar_url } = body;

    if (name !== undefined && (!name.trim() || name.trim().length > 40)) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 40 characters.' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(user.id, {
      name: name !== undefined ? name.trim() : undefined,
      avatar_url: avatar_url !== undefined ? avatar_url.trim() : undefined,
    });

    const stats = await getUserStats(user.id);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      stats,
      message: 'Profile updated successfully!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 400 }
    );
  }
}
