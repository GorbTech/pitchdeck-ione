'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Send } from 'lucide-react';
import Image from 'next/image';

interface ContactShowcaseProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

export default function ContactShowcase({ onComplete }: ContactShowcaseProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formMountTime] = useState(() => Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Backend reads multipart FormData (not JSON) + honeypot + timing.
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('message', formData.message);
      fd.append('website', ''); // honeypot: empty = human
      fd.append('formMountTime', String(formMountTime));
      const res = await fetch('/api/contact', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`contact failed: ${res.status}`);
      setSent(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-40 flex flex-col"
    >
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl text-zinc-900 font-bold tracking-tight">CONTACT</h1>
            <p className="text-zinc-500 text-lg mt-4">Get in touch with GT Energy</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Left: Engineer Corner with large photo */}
            <div className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8 flex flex-col">
              <div className="text-base font-bold text-zinc-900 tracking-wider mb-8">ENGINEER CORNER</div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-zinc-200 mb-8">
                  <Image
                    src="/Gorb.png"
                    alt="Ivan Gorb"
                    width={320}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                </div>

                <blockquote className="text-zinc-600 text-lg italic text-center mb-8 max-w-sm">
                  "The chef's secret is simple — use good ingredients and love what you do."
                </blockquote>

                <div className="text-center mt-auto pt-6 border-t border-zinc-100 w-full">
                  <h3 className="text-2xl font-bold text-zinc-900">Ivan Gorb</h3>
                  <p className="text-lg text-zinc-500 mt-1">CEO, GT GmbH</p>
                </div>
              </div>
            </div>

            {/* Right: Contact Details */}
            <div className="space-y-6">
              {/* Company Info - Combined */}
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6">
                <div className="text-base font-bold text-zinc-900 tracking-wider mb-3">COMPANY</div>

                <div className="space-y-2">
                  <div>
                    <p className="text-lg font-bold text-zinc-900">G.T. GmbH</p>
                    <p className="text-sm text-zinc-500">Autonomous Energy Solutions</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-sm text-zinc-900">Klingsorstraße 105 b</p>
                    <p className="text-sm text-zinc-900">12203 Berlin, Deutschland</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 space-y-1">
                    <a href="mailto:ione@gtmail.ai" className="block text-sm text-zinc-900 hover:text-zinc-600 transition-colors">ione@gtmail.ai</a>
                    <a href="tel:+493041737300" className="block text-sm text-zinc-900 hover:text-zinc-600 transition-colors">+49 30 41737300</a>
                    <a href="https://www.linkedin.com/company/g-t-gmbh/" target="_blank" rel="noopener noreferrer" className="block text-sm text-zinc-900 hover:text-zinc-600 transition-colors">linkedin.com/company/g-t-gmbh</a>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                    <span>HRB: 257661 B</span> · <span>USt-IdNr: DE365568840</span> · <span>StNr: 29 313 31449</span>
                  </div>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm p-8">
                <div className="text-base font-bold text-zinc-900 tracking-wider mb-6">FEEDBACK</div>

                {sent ? (
                  <div className="text-center py-8">
                    <p className="text-lg text-zinc-600">Thank you for your message!</p>
                    <p className="text-sm text-zinc-400 mt-2">We will get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
                      required
                    />
                    <textarea
                      placeholder="Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3 bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 rounded-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? 'Sending...' : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="h-20 bg-white border-t border-zinc-200 flex items-center justify-center px-8">
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-6 py-3 border border-zinc-300 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 rounded-full transition-all duration-200 text-base font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Topics</span>
        </button>
      </div>
    </motion.div>
  );
}
