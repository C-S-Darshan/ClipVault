import { NextResponse } from 'next/server';
import { getAllApprovedUsers } from '@/lib/auth';

export async function GET() {
  try {
    const users = await getAllApprovedUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
