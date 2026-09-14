import { NextRequest, NextResponse } from 'next/server';
import { toggleClipReaction } from '@/lib/data';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    if (!isUserLoggedIn(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: You must sign in to react to clips.' },
        { status: 401 }
      );
    }

    if (!isUserApproved(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Your account is pending admin approval.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const updatedReactions = await toggleClipReaction(params.id, emoji, user.id);
    return NextResponse.json({ success: true, reactions: updatedReactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update reaction' }, { status: 400 });
  }
}
