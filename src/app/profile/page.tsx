import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getUserStats, getAuthorizedClips, getUserActivities } from '@/lib/data';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const [stats, myClips, activities] = await Promise.all([
    getUserStats(user.id),
    getAuthorizedClips({ uploaderId: user.id, currentUserId: user.id }),
    getUserActivities(user.id),
  ]);

  return (
    <div className="container">
      <ProfileClient
        initialUser={user}
        initialStats={stats}
        initialClips={myClips}
        initialActivities={activities}
      />
    </div>
  );
}
