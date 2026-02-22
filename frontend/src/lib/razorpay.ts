/**
 * Razorpay Checkout integration.
 * Requires script: https://checkout.razorpay.com/v1/checkout.js
 */

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
}

interface RazorpayInstance {
  on: (event: string, handler: (response: unknown) => void) => void;
  open: () => void;
}

export interface RazorpayOrderData {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

export function openRazorpayCheckout(
  order: RazorpayOrderData,
  options: {
    name?: string;
    description?: string;
    onSuccess: (paymentId: string, orderId: string, signature: string) => void;
    onFailed?: (err: unknown) => void;
  }
) {
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay checkout script not loaded. Ensure https://checkout.razorpay.com/v1/checkout.js is included.');
  }
  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    order_id: order.orderId,
    name: options.name || 'MediBots Health',
    description: options.description || 'Payment',
    handler: (res) => options.onSuccess(res.razorpay_payment_id, res.razorpay_order_id, res.razorpay_signature),
  });
  rzp.on('payment.failed', (res) => {
    options.onFailed?.(res);
  });
  rzp.open();
}
