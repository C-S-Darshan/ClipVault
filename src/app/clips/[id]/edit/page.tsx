import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getClipById } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';
import { EditClipForm } from './EditClipForm';

interface EditPageProps {
  params: {
    id: string;
  };
}

export default async function EditClipPage({ params }: EditPageProps) {
  const currentUser = await getCurrentUser();
  const clip = await getClipById(params.id, currentUser.id);

  if (!clip) {
    notFound();
  }

  // Uploader only check
  if (clip.uploaded_by !== currentUser.id) {
    redirect(`/clips/${clip.id}`);
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Link
        href={`/clips/${clip.id}`}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Back to Clip
      </Link>

      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Edit Clip Details
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Update metadata, tags, or change visibility permissions for your clip.
          </p>
        </div>

        <EditClipForm clip={clip} />
      </div>
    </div>
  );
}
