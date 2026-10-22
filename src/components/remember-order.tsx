'use client';

import { useEffect } from 'react';
import { saveMyOrder } from '@/lib/my-orders';

/** Adds the order being viewed to "My orders" on this device. */
export function RememberOrder({ orderId }: { orderId: string }) {
  useEffect(() => {
    saveMyOrder(orderId);
  }, [orderId]);
  return null;
}
