import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface OrderSubmission {
  name: string;
  email: string;
  company: string;
  phone: string;
  quantity: number;
  scheme: 'credit' | 'eaas';
  message: string;
  // Configuration summary
  location: string;
  zone: string;
  mode: string;
  model: string;
  stations: number;
  totalPrice: number;
  monthlyPayment: number;
  timestamp: string;
}

function sendEmail(to: string, subject: string, body: string, replyTo: string): Promise<boolean> {
  return new Promise((resolve) => {
    const emailContent = [
      `To: ${to}`,
      `From: iONE Configurator <noreply@gtlab.org>`,
      `Reply-To: ${replyTo}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body
    ].join('\n');

    const sendmail = spawn('/usr/sbin/sendmail', ['-t']);
    sendmail.stdin.write(emailContent);
    sendmail.stdin.end();

    sendmail.on('close', (code) => {
      if (code === 0) {
        console.log(`Order email sent to ${to}`);
        resolve(true);
      } else {
        console.error(`Sendmail exited with code ${code}`);
        resolve(false);
      }
    });

    sendmail.on('error', (err) => {
      console.error('Sendmail error:', err);
      resolve(false);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const submission: OrderSubmission = {
      name: body.name || '',
      email: body.email || '',
      company: body.company || '',
      phone: body.phone || '',
      quantity: body.quantity || 1,
      scheme: body.scheme || 'credit',
      message: body.message || '',
      location: body.location || '',
      zone: body.zone || '',
      mode: body.mode || '',
      model: body.model || '',
      stations: body.stations || 1,
      totalPrice: body.totalPrice || 0,
      monthlyPayment: body.monthlyPayment || 0,
      timestamp: new Date().toISOString(),
    };

    if (!submission.name || !submission.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Save to JSON
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'orders.json');
    await fs.mkdir(dataDir, { recursive: true });

    let orders: OrderSubmission[] = [];
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      orders = JSON.parse(existing);
    } catch { /* file doesn't exist yet */ }

    orders.push(submission);
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2));

    console.log('New order:', {
      name: submission.name,
      email: submission.email,
      scheme: submission.scheme,
      quantity: submission.quantity,
      totalPrice: submission.totalPrice,
    });

    const schemeName = submission.scheme === 'credit' ? 'Credit Purchase' : 'EaaS Subscription';

    const emailBody = `
New Order Inquiry — iONE Configurator
======================================

Customer:
  Name:    ${submission.name}
  Email:   ${submission.email}
  Company: ${submission.company || '—'}
  Phone:   ${submission.phone || '—'}

Order:
  Scheme:     ${schemeName}
  Quantity:   ${submission.quantity} pcs
  Unit price: €${submission.totalPrice.toLocaleString()}
  Total:      €${(submission.totalPrice * submission.quantity).toLocaleString()}
  Monthly:    €${submission.monthlyPayment}/mo

Configuration:
  Mode:     ${submission.mode}
  Model:    ${submission.model}
  Stations: ${submission.stations}
  Location: ${submission.location}
  Zone:     ${submission.zone}

Message:
${submission.message || '(no message)'}

---
Submitted: ${submission.timestamp}
    `.trim();

    const subject = `[iONE Order] ${schemeName} — ${submission.name}${submission.company ? ` (${submission.company})` : ''} — ${submission.quantity} pcs`;

    await sendEmail('orders@gtmail.ai', subject, emailBody, submission.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order form error:', error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
