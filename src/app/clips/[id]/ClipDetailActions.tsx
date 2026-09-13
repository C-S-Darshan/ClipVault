'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Loader2 } from 'lucide-react';

interface ClipDetailActionsProps {
  clipId: string;
}

export const ClipDetailActions: React.FC<ClipDetailActionsProps> = ({ clipId }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this clip from ClipVault? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete clip.');
        setIsDeleting(false);
      }
    } catch (err) {
      alert('Error connecting to server.');
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Link href={`/clips/${clipId}/edit`} className="btn btn-secondary btn-sm">
        <Edit size={14} />
        <span>Edit</span>
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="btn btn-danger btn-sm"
        title="Delete clip"
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        <span>Delete</span>
      </button>
    </div>
  );
};
