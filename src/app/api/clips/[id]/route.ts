import { NextRequest, NextResponse } from 'next/server';
import { getClipById, updateClip, deleteClip } from '@/lib/data';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const clip = await getClipById(params.id, user.id);

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ clip });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    if (!isUserLoggedIn(user) || !isUserApproved(user)) {
      return NextResponse.json({ error: 'Unauthorized: Approved account required.' }, { status: 403 });
    }

    const body = await req.json();

    const updated = await updateClip(params.id, body, user.id);
    return NextResponse.json({ success: true, clip: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update clip' }, { status: 403 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    if (!isUserLoggedIn(user) || !isUserApproved(user)) {
      return NextResponse.json({ error: 'Unauthorized: Approved account required.' }, { status: 403 });
    }

    const success = await deleteClip(params.id, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Clip not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete clip' }, { status: 403 });
  }
}

