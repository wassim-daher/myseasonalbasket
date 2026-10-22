'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelOrderAction } from '@/app/[locale]/account/actions';
import type { Dictionary } from '@/lib/i18n';

/** Lets the shopper cancel their own order while the farm hasn't confirmed it. */
export function CancelOrder({ orderId, t }: { orderId: string; t: Dictionary }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const a = t.account;

  if (!asking) {
    return <button type="button" className="link-button cancel-link" onClick={() => setAsking(true)}>{a.cancel}</button>;
  }
  return (
    <div className="panel cancel-panel" role="group" aria-label={a.cancel}>
      <p>{a.cancelAsk}</p>
      {failed && <p className="alert" role="alert">{a.cancelTooLate}</p>}
      <div className="actions">
        <button
          type="button"
          className="btn btn-danger"
          disabled={pending}
          onClick={() => start(async () => {
            const result = await cancelOrderAction(orderId);
            if (result.ok) router.refresh();
            else setFailed(true);
          })}
        >
          {a.cancelConfirm}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setAsking(false)}>{a.keep}</button>
      </div>
    </div>
  );
}
