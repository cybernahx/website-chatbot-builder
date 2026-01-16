const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, name) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Welcome to AI Chatbot Builder! 🚀',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4A90E2;">Welcome ${name}!</h1>
                        <p>Thank you for signing up for AI Chatbot Builder.</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Upload your PDFs and train AI chatbots</li>
                            <li>Capture leads automatically</li>
                            <li>Integrate with your website in minutes</li>
                        </ul>
                        <a href="${process.env.FRONTEND_URL}" 
                           style="display: inline-block; background: #4A90E2; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                                  margin-top: 20px;">
                            Get Started
                        </a>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Welcome email error:', error);
            return false;
        }
    }

    /**
     * Send lead notification email
     */
    async sendLeadNotification(recipients, lead, botName) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: recipients.join(', '),
                subject: `New Lead from ${botName}! 🎯`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4A90E2;">New Lead Captured!</h2>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
                            <p><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
                            <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
                            ${lead.interestedIn ? `<p><strong>Interested In:</strong> ${lead.interestedIn}</p>` : ''}
                            ${lead.preferredLocation ? `<p><strong>Location:</strong> ${lead.preferredLocation}</p>` : ''}
                            ${lead.budget ? `<p><strong>Budget:</strong> ${lead.budget.min} - ${lead.budget.max} ${lead.budget.currency}</p>` : ''}
                        </div>
                        <p><strong>Quality Score:</strong> ${'⭐'.repeat(lead.qualityScore)}</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            Lead ID: ${lead.leadId}<br>
                            Captured at: ${new Date(lead.createdAt).toLocaleString()}
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Lead notification email error:', error);
            return false;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Reset Your Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Reset Your Password</h2>
                        <p>You requested to reset your password. Click the button below:</p>
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: #4A90E2; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                                  margin-top: 20px;">
                            Reset Password
                        </a>
                        <p style="margin-top: 20px; color: #666; font-size: 14px;">
                            This link will expire in 1 hour.
                        </p>
                        <p style="color: #666; font-size: 12px;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Password reset email error:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
