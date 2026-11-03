import React from 'react';

interface GuildMarkProps {
  mark?: string;
  size?: number; // size per pixel in px (e.g. 3 or 4)
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  '0': 'transparent',
  '1': '#000000',
  '2': '#8c8a8d',
  '3': '#ffffff',
  '4': '#fe0000',
  '5': '#ff8a00',
  '6': '#ffff00',
  '7': '#8cff01',
  '8': '#00ff00',
  '9': '#01ff8d',
  'a': '#00ffff',
  'b': '#008aff',
  'c': '#0000fe',
  'd': '#8c00ff',
  'e': '#ff00fe',
  'f': '#ff008c',
};

export const GuildMark: React.FC<GuildMarkProps> = ({
  mark = '1114411111433411143223414321123443211234143223411143341111144111',
  size = 4,
  className = '',
}) => {
  if (!mark) return null;

  let cleanMark = mark.toLowerCase();
  while (cleanMark.length < 64) cleanMark += '0';

  const rows: string[][] = [];
  for (let r = 0; r < 8; r++) {
    const row = cleanMark.slice(r * 8, r * 8 + 8).split('');
    rows.push(row);
  }

  return (
    <div
      className={`inline-block border border-slate-700/60 rounded bg-black overflow-hidden shadow-sm shrink-0 ${className}`}
      style={{
        width: size * 8,
        height: size * 8,
      }}
      title="Emblema Oficial de Guild"
    >
      <svg
        width={size * 8}
        height={size * 8}
        viewBox="0 0 8 8"
        className="block"
        shapeRendering="crispEdges"
      >
        {rows.map((row, y) =>
          row.map((char, x) => {
            const color = COLOR_MAP[char] || 'transparent';
            if (color === 'transparent') return null;
            return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
          })
        )}
      </svg>
    </div>
  );
};
