import { NextResponse } from 'next/server';
import { getDeliveryOptions } from '@/server/shop';

// Delivery days still open for one area. Read fresh on every request.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const zone = new URL(request.url).searchParams.get('zone') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(zone)) return NextResponse.json({ options: [] }, { status: 400 });
  try {
    const options = await getDeliveryOptions(zone);
    return NextResponse.json({ options }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('delivery options failed', error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
