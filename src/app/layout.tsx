import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser, isSupabaseConfigured } from '@/lib/auth';
import { AuthButton } from '@/components/AuthButton';
import { Film, Plus, ShieldCheck, Search, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ClipVault — Private Friend Group Clip Library',
  description: 'Private, authenticated media library for organizing, watching, and discussing clips.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const hasCloudConfig = isSupabaseConfigured();

  return (
    <html lang="en">
      <body>
        {!hasCloudConfig && (
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>
              <strong>Local Preview Mode:</strong> Interactive mock data is active. Connect your Supabase project in{' '}
              <code style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>
                .env.local
              </code>{' '}
              to enable live PostgreSQL & Google OAuth.
            </span>
          </div>
        )}

        {/* Global Navigation */}
        <header className="glass-nav">
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '4.25rem',
              gap: '1.5rem',
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Film size={18} color="#fff" />
              </div>
              <span>
                Clip<span style={{ color: 'var(--accent-primary)' }}>Vault</span>
              </span>
            </Link>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/add" className="btn btn-primary">
                <Plus size={16} />
                <span>Add Clip</span>
              </Link>

              {/* User Account / Auth Button */}
              <AuthButton user={user} hasCloudConfig={hasCloudConfig} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ minHeight: 'calc(100vh - 12rem)', padding: '2rem 0' }}>{children}</main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '2.5rem 0',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.85rem',
          }}
        >
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <p>
              <strong>ClipVault</strong> — Private friend-group media vault. YouTube unlisted videos deliver the stream, ClipVault provides the authorization & metadata layer.
            </p>
            <p style={{ fontSize: '0.75rem' }}>
              Zero-cost architecture built with Next.js 14, TypeScript & PostgreSQL.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
