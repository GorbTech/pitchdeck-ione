'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheme: 'credit' | 'eaas';
  // Config data
  location: string;
  zone: string;
  mode: string;
  model: string;
  stations: number;
  totalPrice: number;
  monthlyPayment: number;
}

export default function OrderModal({
  isOpen, onClose, scheme,
  location, zone, mode, model, stations, totalPrice, monthlyPayment
}: OrderModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    quantity: 1,
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const schemeName = scheme === 'credit' ? 'Credit Purchase' : 'EaaS Subscription';
  const unitTotal = totalPrice * form.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheme,
          location,
          zone,
          mode,
          model,
          stations,
          totalPrice,
          monthlyPayment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send');
      }
    } catch {
      setError('Connection error');
    }
    setSending(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{schemeName}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{model} · {location}</p>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">&#10003;</div>
                <h4 className="text-lg font-medium text-zinc-900 mb-1">Request Sent</h4>
                <p className="text-sm text-zinc-500">We will contact you shortly at {form.email}</p>
                <button onClick={onClose} className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                {/* Price summary */}
                <div className="bg-zinc-50 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Unit price</span>
                    <span className="text-zinc-700 font-medium">&euro;{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-zinc-500">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={form.quantity}
                      onChange={(e) => setForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-16 text-right text-zinc-900 font-medium bg-white border border-zinc-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-zinc-200 pt-1 mt-1">
                    <span className="text-zinc-700">Total</span>
                    <span className="text-zinc-900">&euro;{unitTotal.toLocaleString()}</span>
                  </div>
                  {monthlyPayment > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Monthly</span>
                      <span className="text-zinc-500">&euro;{(monthlyPayment * form.quantity).toLocaleString()}/mo</span>
                    </div>
                  )}
                </div>

                {/* Contact fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wide">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full mt-0.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wide">Company</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full mt-0.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                      placeholder="Company Ltd."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wide">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full mt-0.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full mt-0.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                    placeholder="+49 ..."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wide">Message / Questions</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full mt-0.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 resize-none"
                    placeholder="Any questions or special requirements..."
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `Request ${schemeName}`}
                </button>

                <p className="text-[10px] text-zinc-400 text-center">
                  Your inquiry will be sent to our sales team. We typically respond within 24 hours.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
