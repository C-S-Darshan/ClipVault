'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, RotateCcw, Sparkles } from 'lucide-react';

export interface ThemeOption {
  name: string;
  accent: string;
  glow: string;
}

export interface BgOption {
  name: string;
  bgMain: string;
  bgSurface: string;
  bgElevated: string;
  bgGlass: string;
}

export const ACCENT_PRESETS: ThemeOption[] = [
  { name: 'Electric Indigo', accent: '#6366f1', glow: 'rgba(99, 102, 241, 0.25)' },
  { name: 'Cyber Cyan', accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)' },
  { name: 'Viper Emerald', accent: '#10b981', glow: 'rgba(16, 185, 129, 0.25)' },
  { name: 'Amethyst Violet', accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.25)' },
  { name: 'Crimson Flame', accent: '#f43f5e', glow: 'rgba(244, 63, 94, 0.25)' },
  { name: 'Solar Amber', accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)' },
  { name: 'Neon Pink', accent: '#ec4899', glow: 'rgba(236, 72, 153, 0.25)' },
];

export const BG_PRESETS: BgOption[] = [
  {
    name: 'Midnight Void (Default)',
    bgMain: '#090c13',
    bgSurface: '#10141e',
    bgElevated: '#161c2b',
    bgGlass: 'rgba(16, 20, 30, 0.75)',
  },
  {
    name: 'OLED Obsidian',
    bgMain: '#000000',
    bgSurface: '#0a0a0e',
    bgElevated: '#13131a',
    bgGlass: 'rgba(10, 10, 14, 0.85)',
  },
  {
    name: 'Deep Slate Navy',
    bgMain: '#0b1329',
    bgSurface: '#111d3f',
    bgElevated: '#182955',
    bgGlass: 'rgba(17, 29, 63, 0.8)',
  },
  {
    name: 'Cyberpunk Velvet',
    bgMain: '#120a1d',
    bgSurface: '#1d102e',
    bgElevated: '#281740',
    bgGlass: 'rgba(29, 16, 46, 0.85)',
  },
  {
    name: 'Abyss Forest',
    bgMain: '#06130c',
    bgSurface: '#0d1f14',
    bgElevated: '#142c1d',
    bgGlass: 'rgba(13, 31, 20, 0.85)',
  },
];

export function applyTheme(accent: string, bg: BgOption) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--accent-primary', accent);
  root.style.setProperty('--accent-primary-hover', accent);
  root.style.setProperty('--accent-primary-glow', `rgba(${hexToRgb(accent)}, 0.25)`);
  root.style.setProperty('--border-active', `rgba(${hexToRgb(accent)}, 0.45)`);
  root.style.setProperty('--shadow-glow', `0 0 20px rgba(${hexToRgb(accent)}, 0.2)`);

  root.style.setProperty('--bg-main', bg.bgMain);
  root.style.setProperty('--bg-surface', bg.bgSurface);
  root.style.setProperty('--bg-surface-elevated', bg.bgElevated);
  root.style.setProperty('--bg-surface-glass', bg.bgGlass);

  localStorage.setItem(
    'clipvault_theme',
    JSON.stringify({
      accent,
      bg,
    })
  );
}

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '99, 102, 241';
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export const ThemeCustomizer: React.FC = () => {
  const [currentAccent, setCurrentAccent] = useState(ACCENT_PRESETS[0].accent);
  const [currentBg, setCurrentBg] = useState<BgOption>(BG_PRESETS[0]);
  const [customAccent, setCustomAccent] = useState('#6366f1');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipvault_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accent) {
          setCurrentAccent(parsed.accent);
          setCustomAccent(parsed.accent);
        }
        if (parsed.bg) {
          setCurrentBg(parsed.bg);
        }
      }
    } catch {}
  }, []);

  const handleSelectAccent = (color: string) => {
    setCurrentAccent(color);
    setCustomAccent(color);
    applyTheme(color, currentBg);
  };

  const handleCustomAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAccent(val);
    setCurrentAccent(val);
    applyTheme(val, currentBg);
  };

  const handleSelectBg = (bg: BgOption) => {
    setCurrentBg(bg);
    applyTheme(currentAccent, bg);
  };

  const handleReset = () => {
    setCurrentAccent(ACCENT_PRESETS[0].accent);
    setCustomAccent(ACCENT_PRESETS[0].accent);
    setCurrentBg(BG_PRESETS[0]);
    applyTheme(ACCENT_PRESETS[0].accent, BG_PRESETS[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Accent Color Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Palette size={16} color="var(--accent-primary)" /> Primary Accent Color
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Buttons, glows, badges, highlights
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {ACCENT_PRESETS.map((p) => {
            const isSelected = currentAccent.toLowerCase() === p.accent.toLowerCase();
            return (
              <button
                key={p.accent}
                type="button"
                onClick={() => handleSelectAccent(p.accent)}
                title={p.name}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: p.accent,
                  border: isSelected ? '3px solid #fff' : '2px solid transparent',
                  boxShadow: isSelected ? `0 0 15px ${p.accent}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
              </button>
            );
          })}

          {/* Custom Color Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.65rem',
              marginLeft: '0.25rem',
            }}
          >
            <input
              type="color"
              value={customAccent}
              onChange={handleCustomAccentChange}
              title="Pick a custom color"
              style={{
                width: '1.75rem',
                height: '1.75rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {customAccent}
            </span>
          </div>
        </div>
      </div>

      {/* Background / Main Theme Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={16} color="var(--accent-secondary)" /> Main UI Atmosphere & Theme
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Background canvas and glass panels
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {BG_PRESETS.map((bg) => {
            const isSelected = currentBg.name === bg.name;
            return (
              <button
                key={bg.name}
                type="button"
                onClick={() => handleSelectBg(bg)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: bg.bgSurface,
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '4px',
                      background: bg.bgMain,
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                    {bg.name.replace(' (Default)', '')}
                  </span>
                </div>
                {isSelected && <Check size={14} color="var(--accent-primary)" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Box & Reset */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="badge" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            Live Accent
          </span>
          <button className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
            Button Preview
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
        >
          <RotateCcw size={13} /> Reset to Default
        </button>
      </div>
    </div>
  );
};
