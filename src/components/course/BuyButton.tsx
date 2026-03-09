'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Tag, ShoppingCart, Check } from 'lucide-react';
import Script from 'next/script';
import { fetchApi } from '@/lib/api';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface BuyButtonProps {
    courseId: string;
    courseName: string;
    coursePrice: number;
    slug: string;
}

export default function BuyButton({ courseId, courseName, coursePrice, slug }: BuyButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const finalPrice = promoApplied
        ? Math.max(0, coursePrice - promoApplied.discount)
        : coursePrice;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoError(null);
        setPromoApplied(null);
        try {
            const res = await fetchApi<{ valid: boolean; discount: number; message: string }>(
                '/api/promocode/validate',
                {
                    method: 'POST',
                    body: JSON.stringify({ code: promoCode.trim().toUpperCase(), courseId }),
                }
            );
            if (res.success && res.data?.valid) {
                setPromoApplied({ code: promoCode.trim().toUpperCase(), discount: res.data.discount });
            } else {
                setPromoError(res.data?.message || res.error?.message || 'Invalid promo code');
            }
        } catch {
            setPromoError('Failed to validate promo code');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleBuy = async () => {
        setLoading(true);
        setError(null);

        // 1. Create Razorpay order
        try {
            const orderRes = await fetchApi<{
                orderId: string;
                amount: number;
                currency: string;
                keyId: string;
            }>('/api/enroll/create-order', {
                method: 'POST',
                body: JSON.stringify({
                    courseId,
                    promoCode: promoApplied?.code || undefined,
                }),
            });

            if (!orderRes.success || !orderRes.data) {
                if (orderRes.error?.code === 'AUTH_REQUIRED' || orderRes.error?.code === 'UNAUTHORIZED') {
                    // Not logged in — redirect to dashboard to trigger auth modal
                    router.push(`/dashboard?redirect=/courses/${slug}`);
                    return;
                }
                throw new Error(orderRes.error?.message || 'Failed to create order');
            }

            const { orderId, amount, currency, keyId } = orderRes.data;

            // 2. Open Razorpay
            if (!window.Razorpay) {
                throw new Error('Payment gateway not loaded. Please refresh and try again.');
            }

            const rzp = new window.Razorpay({
                key: keyId,
                amount,
                currency,
                name: 'Sprintern',
                description: courseName,
                order_id: orderId,
                prefill: {},
                theme: { color: '#9333ea' },
                modal: {
                    ondismiss: () => setLoading(false),
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    // 3. Verify payment
                    const verifyRes = await fetchApi<{ enrollmentId: string }>(
                        '/api/enroll/verify-payment',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        }
                    );

                    if (verifyRes.success && verifyRes.data?.enrollmentId) {
                        router.push(`/learn/${verifyRes.data.enrollmentId}/day/1`);
                    } else {
                        setError('Payment verified but enrollment failed. Please contact support.');
                        setLoading(false);
                    }
                },
            });

            rzp.on('payment.failed', (resp: any) => {
                setError(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
                setLoading(false);
            });

            rzp.open();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <>
            {/* Load Razorpay SDK */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setScriptLoaded(true)}
                strategy="afterInteractive"
            />

            <div className="flex flex-col gap-3 mt-2">
                {/* Promo Code Input */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                        <input
                            type="text"
                            value={promoCode}
                            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); setPromoApplied(null); }}
                            placeholder="Promo code"
                            disabled={!!promoApplied}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 transition-all disabled:opacity-50"
                            style={poppins}
                        />
                    </div>
                    <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim() || !!promoApplied}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${promoApplied
                                ? 'bg-green-400 text-green-900'
                                : 'bg-white/20 text-white hover:bg-white/30 disabled:opacity-50'
                            }`}
                        style={poppins}
                    >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : promoApplied ? <Check className="w-4 h-4" /> : 'Apply'}
                    </button>
                </div>

                {promoApplied && (
                    <p className="text-green-300 text-sm flex items-center gap-1.5" style={poppins}>
                        <Check className="w-3.5 h-3.5" /> Code <strong>{promoApplied.code}</strong> applied — ₹{promoApplied.discount} off!
                    </p>
                )}
                {promoError && (
                    <p className="text-red-300 text-sm" style={poppins}>{promoError}</p>
                )}

                {/* Final Price Display */}
                {promoApplied && (
                    <div className="flex items-center gap-3">
                        <span className="text-white/50 line-through text-xl" style={outfit}>₹{coursePrice}</span>
                        <span className="text-3xl font-bold text-white" style={{ ...outfit, fontWeight: 800 }}>₹{finalPrice}</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <p className="text-red-300 text-sm bg-red-500/10 px-4 py-2 rounded-xl" style={poppins}>{error}</p>
                )}

                {/* Buy Button */}
                <button
                    onClick={handleBuy}
                    disabled={loading || !scriptLoaded}
                    className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{ ...poppins, fontWeight: 600 }}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ShoppingCart className="w-5 h-5" />
                    )}
                    {loading ? 'Processing…' : `Buy Full Course — ₹${finalPrice}`}
                </button>
            </div>
        </>
    );
}
