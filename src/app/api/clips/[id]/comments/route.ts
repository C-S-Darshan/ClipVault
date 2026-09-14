import { NextRequest, NextResponse } from 'next/server';
import { getClipComments, addClipComment, deleteClipComment } from '@/lib/data';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = await getClipComments(params.id);
    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    if (!isUserLoggedIn(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: You must sign in to leave a comment.' },
        { status: 401 }
      );
    }

    if (!isUserApproved(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Your account is pending admin approval before you can comment.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    const comment = await addClipComment(params.id, content, user);
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add comment' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId query param is required.' }, { status: 400 });
    }

    const success = await deleteClipComment(commentId, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete comment' }, { status: 403 });
  }
}
