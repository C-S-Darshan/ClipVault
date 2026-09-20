import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserLoggedIn } from '@/lib/auth';
import { getUserActivities } from '@/lib/data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!isUserLoggedIn(user)) {
      return NextResponse.json({ success: true, activities: [] });
    }

    const activities = await getUserActivities(user.id);

    return NextResponse.json({
      success: true,
      activities,
      total: activities.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
