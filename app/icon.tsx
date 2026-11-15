import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// Browser-tab icon: a yellow dog tag stamped "RP"
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div
          style={{
            width: 60, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: '#FFDC28', border: '4px solid #FF2B85', borderRadius: 18,
          }}
        >
          <div style={{ width: 9, height: 9, borderRadius: 9, background: '#1A002D', marginTop: 4 }} />
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 900, color: '#1A002D', letterSpacing: -1, marginTop: -3 }}>RP</div>
        </div>
      </div>
    ),
    size,
  );
}
