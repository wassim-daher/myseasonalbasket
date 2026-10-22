import { format, formatDay, type Dictionary, type Locale } from '@/lib/i18n';
import { displayStatus, orderSteps } from '@/lib/order-progress';
import type { OrderSummary } from '@/lib/shop-types';

/** Where an order stands: placed → confirmed by the farm → payment → delivery. */
export function OrderProgress({ order, locale, t }: { order: OrderSummary; locale: Locale; t: Dictionary }) {
  const steps = orderSteps(order);
  if (!steps) {
    return <p className="alert">{displayStatus(order) === 'rejected' ? t.order.closedRejected : t.order.closedCancelled}</p>;
  }
  const values = {
    date: formatDay(locale, order.deliveryDate),
    time: `\u2066${order.startTime}–${order.endTime}\u2069`,
    delivered: order.tracking.deliveredOn ? formatDay(locale, order.tracking.deliveredOn) : formatDay(locale, order.deliveryDate),
  };
  return (
    <section className="panel" aria-labelledby="progress">
      <h2 id="progress">{t.order.progress}</h2>
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.key} className={`step step-${s.state}`} aria-current={s.state === 'current' ? 'step' : undefined}>
            <span className="step-dot" aria-hidden="true">
              {s.state === 'done' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
            </span>
            <span>{format(t.order.steps[s.key], values)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
