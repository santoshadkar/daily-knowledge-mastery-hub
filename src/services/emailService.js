const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Notification Service for Daily Concept Digests
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  async initTransporter() {
    if (process.env.SIMULATION_MODE === 'true') {
      // Create Ethereal test account if simulation mode is explicitly true
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 EmailService: Initialized Ethereal Test Account:', testAccount.user);
      } catch (err) {
        console.log('⚠️ EmailService: Falling back to Local Console Logger transporter:', err.message);
        this.transporter = null;
      }
    } else if (process.env.RESEND_API_KEY) {
      // Use Resend API Key via SMTP (smtp.resend.com)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
      console.log('📧 EmailService: Initialized Resend SMTP Transporter with provided API key.');
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Standard Gmail / Custom SMTP Configuration
      const sanitizedPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: sanitizedPass
        }
      });
      console.log(`📧 EmailService: Initialized SMTP Transporter (${process.env.SMTP_HOST || 'smtp.gmail.com'}) for user ${process.env.SMTP_USER}`);
    } else {
      console.log('⚠️ EmailService: No valid email credentials found.');
      this.transporter = null;
    }
  }

  generateEmailHTML(conceptsInput, recipientEmail) {
    const concepts = Array.isArray(conceptsInput) ? conceptsInput : [conceptsInput];

    const conceptCards = concepts.map(concept => {
      const isAI = concept.track.includes('AI') || concept.track.includes('Artificial');
      const isAgile = concept.track.includes('Agile');
      const badgeColor = isAI ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' :
                         isAgile ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' :
                         'linear-gradient(135deg, #10b981, #059669)';
      const trackIcon = isAI ? '🤖' : isAgile ? '🎯' : '🧠';

      const principlesHtml = concept.corePrinciples.slice(0, 3).map(p => {
        const text = typeof p === 'string' ? p : `${p.title}: ${p.meaning}`;
        return `<li style="margin-bottom: 6px;">${text}</li>`;
      }).join('');

      return `
        <div style="background: #0f172a; padding: 22px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155;">
          <div style="margin-bottom: 10px;">
            <span style="background: ${badgeColor}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${trackIcon} ${concept.track}
            </span>
          </div>
          <h2 style="color: #60a5fa; margin-top: 6px; margin-bottom: 6px; font-size: 20px;">${concept.title}</h2>
          <p style="color: #94a3b8; font-style: italic; font-size: 14px; margin: 0 0 16px 0;">"${concept.tagline}"</p>

          <div style="background: #1e293b; padding: 14px; border-radius: 8px; margin-bottom: 14px; border-left: 3px solid #6366f1;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 12px; text-transform: uppercase; margin-bottom: 6px;">💡 Executive Overview</div>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #cbd5e1;">
              ${concept.overview.replace(/^#.*$/gm, '').trim().substring(0, 280)}...
            </p>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-weight: 700; color: #a78bfa; font-size: 12px; text-transform: uppercase; margin-bottom: 6px;">🔑 Key Takeaways</div>
            <ul style="margin: 0; padding-left: 18px; color: #e2e8f0; font-size: 13px;">
              ${principlesHtml}
            </ul>
          </div>

          <div style="background: #1e293b; padding: 12px; border-radius: 8px; font-size: 13px;">
            <span style="color: #f43f5e; font-weight: bold;">📚 Recommended Book:</span> 
            <span style="color: #f1f5f9; font-weight: 600;">${concept.books[0].title}</span> 
            <span style="color: #94a3b8;">(by ${concept.books[0].author})</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 680px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          h1 { color: #ffffff; font-size: 24px; margin-top: 16px; margin-bottom: 6px; }
          .sub { color: #94a3b8; font-size: 15px; margin-bottom: 28px; }
          .cta-btn { display: block; text-align: center; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff !important; padding: 16px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 28px; }
          .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div><span class="badge">☀️ DAILY TRIPLE-TRACK DIGEST • 7:00 AM RENEWAL</span></div>
          <h1>Today's 3 Executive Masterclasses</h1>
          <p class="sub">Your daily end-to-end learning across Artificial Intelligence, Agile Coaching & Leadership.</p>

          ${conceptCards}

          <a href="http://localhost:3000" class="cta-btn">🚀 Open Daily Portal & Study Today's Masterclasses</a>

          <div class="footer">
            Sent to ${recipientEmail || process.env.SUBSCRIBER_EMAIL || 'you'} by Daily Concept Mastery Portal • Powered by Antigravity AI Architecture
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendMorningDigest(conceptsInput, recipientEmail) {
    await this.initTransporter();

    const targetRecipient = recipientEmail || process.env.SUBSCRIBER_EMAIL || process.env.SMTP_USER || 'santoshadkar@gmail.com';
    const concepts = Array.isArray(conceptsInput) ? conceptsInput : [conceptsInput];
    
    // Default sender address: Resend onboarding address if using Resend API Key, otherwise custom SMTP address
    let senderAddress = '"Daily Concept Mastery Portal" <onboarding@resend.dev>';
    if (!process.env.RESEND_API_KEY && process.env.SMTP_USER) {
      senderAddress = `"Daily Concept Mastery Portal" <${process.env.SMTP_USER}>`;
    }

    const subjectTitle = concepts.length > 1 ? 
      `☀️ [7:00 AM Digest] Today's 3 Masterclasses: AI, Agile & Soft Skills` :
      `☀️ [7:00 AM Digest] Today's Masterclass: ${concepts[0].title}`;

    const mailOptions = {
      from: senderAddress,
      to: targetRecipient,
      subject: subjectTitle,
      html: this.generateEmailHTML(concepts, targetRecipient)
    };

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`✅ Email sent successfully to ${mailOptions.to} (Message ID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          previewUrl: previewUrl || 'Sent via active Resend / SMTP'
        };
      } catch (err) {
        console.error('❌ Failed to send email via transporter:', err.message);
        return {
          success: false,
          error: err.message,
          previewUrl: 'Check server logs for error details'
        };
      }
    } else {
      console.log(`[SIMULATED MAIL DISPATCH] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      return {
        success: true,
        message: 'Simulated email dispatch successful',
        previewUrl: 'Simulated (Log Output)'
      };
    }
  }
}

module.exports = new EmailService();


