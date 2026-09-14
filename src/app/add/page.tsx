import React from 'react';
import { getCurrentUser, isUserLoggedIn, isUserApproved } from '@/lib/auth';
import { AddClipForm } from './AddClipForm';
import { AddClipGate } from './AddClipGate';

export const metadata = {
  title: 'Add Clip — ClipVault',
  description: 'Upload an unlisted YouTube clip to your private ClipVault library.',
};

export default async function AddClipPage() {
  const user = await getCurrentUser();
  const loggedIn = isUserLoggedIn(user);
  const approved = isUserApproved(user);

  if (!loggedIn) {
    return <AddClipGate mode="unauthenticated" />;
  }

  if (!approved) {
    return <AddClipGate mode="pending" user={user} />;
  }

  return <AddClipForm user={user} />;
}
