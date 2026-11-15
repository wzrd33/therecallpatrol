import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Scout the beagle, mascot of Recall Patrol';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link-preview card for texts and social posts: Scout's hero badge beside the headline
export default async function OpenGraphImage() {
  const scout = await readFile(join(process.cwd(), 'public/images/scout-share.png'));
  const src = `data:image/png;base64,${scout.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64,
          padding: '0 80px', backgroundColor: '#1A002D',
          backgroundImage: 'radial-gradient(circle at 28% 50%, rgba(255,43,133,0.35), rgba(26,0,45,0) 55%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={440} height={440} alt="" style={{ borderRadius: 64, border: '6px solid rgba(255,255,255,0.12)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: 6, color: '#00C9D7', marginBottom: 18 }}>YOUR HOME SAFETY PARTNER</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: '#FFFFFF' }}>Scout the Recalls.</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: '#FF2B85' }}>Guard Your Home.</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#FFDC28', marginTop: 28 }}>therecallpatrol.com</div>
        </div>
      </div>
    ),
    size,
  );
}
