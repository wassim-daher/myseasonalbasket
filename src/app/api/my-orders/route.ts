import { NextResponse } from 'next/server';
import { isOrderId, MAX_KEPT } from '@/lib/my-orders';
import { getMyOrders } from '@/server/shop';

// The orders a browser remembers. Each id is a random UUID that already serves as
// the private link to its order, so knowing it is what allows reading it.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter(isOrderId).slice(0, MAX_KEPT) : [];
  try {
    const orders = await getMyOrders(ids);
    return NextResponse.json({ orders }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('my orders failed', error);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
