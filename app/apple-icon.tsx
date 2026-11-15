import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Home-screen icon: a yellow dog tag stamped "RP"
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A002D' }}>
        <div
          style={{
            width: 140, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: '#FFDC28', border: '9px solid #FF2B85', borderRadius: 40,
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 20, background: '#1A002D', marginTop: 10 }} />
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 900, color: '#1A002D', letterSpacing: -2, marginTop: -6 }}>RP</div>
        </div>
      </div>
    ),
    size,
  );
}
