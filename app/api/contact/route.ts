import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface ContactSubmission {
  name: string;
  email: string;
  company: string;
  message: string;
  orgType: string;
  orgFocus: string;
  orgName: string;
  fileName?: string;
  timestamp: string;
}

async function sendEmailWithAttachment(
  to: string,
  subject: string,
  body: string,
  replyTo: string,
  attachment?: { name: string; path: string; type: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`;

    let emailContent: string;

    if (attachment) {
      // Multipart email with attachment
      emailContent = [
        `To: ${to}`,
        `From: iONE Pitch Deck <noreply@gtlab.org>`,
        `Reply-To: ${replyTo}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        body,
        ``,
        `--${boundary}`,
        `Content-Type: ${attachment.type}; name="${attachment.name}"`,
        `Content-Disposition: attachment; filename="${attachment.name}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
      ].join('\r\n');
    } else {
      // Simple text email
      emailContent = [
        `To: ${to}`,
        `From: iONE Pitch Deck <noreply@gtlab.org>`,
        `Reply-To: ${replyTo}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        body
      ].join('\n');
    }

    const sendmail = spawn('/usr/sbin/sendmail', ['-t']);

    if (attachment) {
      // Write headers and body first
      sendmail.stdin.write(emailContent);

      // Read and encode attachment
      fs.readFile(attachment.path)
        .then((fileData) => {
          const base64Data = fileData.toString('base64');
          // Split into 76-character lines
          const lines = base64Data.match(/.{1,76}/g) || [];
          sendmail.stdin.write(lines.join('\r\n'));
          sendmail.stdin.write(`\r\n--${boundary}--\r\n`);
          sendmail.stdin.end();
        })
        .catch((err) => {
          console.error('Error reading attachment:', err);
          sendmail.stdin.end();
        });
    } else {
      sendmail.stdin.write(emailContent);
      sendmail.stdin.end();
    }

    sendmail.on('close', (code) => {
      if (code === 0) {
        console.log(`Email sent successfully to ${to}`);
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

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const submission: ContactSubmission = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      company: formData.get('company')?.toString() || '',
      message: formData.get('message')?.toString() || '',
      orgType: formData.get('orgType')?.toString() || '',
      orgFocus: formData.get('orgFocus')?.toString() || '',
      orgName: formData.get('orgName')?.toString() || '',
      timestamp: new Date().toISOString()
    };

    // Handle file upload
    const file = formData.get('file') as File | null;
    let attachmentInfo: { name: string; path: string; type: string } | undefined;

    if (file && file.size > 0) {
      // Check file size (10 MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10 MB.' },
          { status: 400 }
        );
      }

      // Save file to uploads directory
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = path.join(uploadsDir, `${timestamp}_${safeFileName}`);

      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      submission.fileName = safeFileName;
      attachmentInfo = {
        name: safeFileName,
        path: filePath,
        type: getMimeType(safeFileName)
      };

      console.log(`File saved: ${filePath}`);
    }

    // Save submission to JSON file
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'contacts.json');

    await fs.mkdir(dataDir, { recursive: true });

    let contacts: ContactSubmission[] = [];
    try {
      const existingData = await fs.readFile(filePath, 'utf-8');
      contacts = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet
    }

    contacts.push(submission);
    await fs.writeFile(filePath, JSON.stringify(contacts, null, 2));

    // Log for monitoring
    console.log('New contact submission:', {
      name: submission.name,
      email: submission.email,
      company: submission.company,
      orgType: submission.orgType,
      hasFile: !!attachmentInfo,
      timestamp: submission.timestamp
    });

    // Prepare email body
    const emailBody = `
New Contact from iONE Pitch Deck
================================

Name: ${submission.name}
Email: ${submission.email}
Company: ${submission.company || 'Not specified'}
Organization Type: ${submission.orgType}
Organization Focus: ${submission.orgFocus}
Organization Name: ${submission.orgName}

Message:
${submission.message}

${attachmentInfo ? `\nAttachment: ${attachmentInfo.name}` : ''}
---
Submitted at: ${submission.timestamp}
    `.trim();

    const subject = `[iONE Pitch Deck] New inquiry from ${submission.name}${submission.company ? ` (${submission.company})` : ''}`;

    // Send email to admin@gtmail.ai
    await sendEmailWithAttachment('admin@gtmail.ai', subject, emailBody, submission.email, attachmentInfo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
