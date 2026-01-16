const twilio = require('twilio');

class WhatsAppService {
    constructor() {
        this.client = null;
        
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
        }
        
        this.fromNumber = process.env.WHATSAPP_PHONE_NUMBER;
    }

    /**
     * Send WhatsApp notification about new lead
     */
    async sendLeadNotification(toNumber, lead, botName) {
        if (!this.client) {
            console.warn('Twilio not configured. Skipping WhatsApp notification.');
            return false;
        }

        try {
            const message = this.formatLeadMessage(lead, botName);
            
            await this.client.messages.create({
                from: `whatsapp:${this.fromNumber}`,
                to: `whatsapp:${toNumber}`,
                body: message
            });

            console.log(`WhatsApp notification sent to ${toNumber}`);
            return true;
        } catch (error) {
            console.error('WhatsApp notification error:', error);
            return false;
        }
    }

    /**
     * Format lead data into WhatsApp message
     */
    formatLeadMessage(lead, botName) {
        let message = `🎯 *New Lead from ${botName}!*\n\n`;
        
        if (lead.name) message += `👤 *Name:* ${lead.name}\n`;
        if (lead.email) message += `📧 *Email:* ${lead.email}\n`;
        if (lead.phone) message += `📱 *Phone:* ${lead.phone}\n`;
        
        if (lead.interestedIn) {
            message += `\n🏠 *Interested In:* ${lead.interestedIn}\n`;
        }
        
        if (lead.preferredLocation) {
            message += `📍 *Location:* ${lead.preferredLocation}\n`;
        }
        
        if (lead.budget) {
            message += `💰 *Budget:* ${lead.budget.min} - ${lead.budget.max} ${lead.budget.currency}\n`;
        }
        
        message += `\n⭐ *Quality Score:* ${'★'.repeat(lead.qualityScore)}${'☆'.repeat(5 - lead.qualityScore)}`;
        message += `\n\n🆔 Lead ID: ${lead.leadId}`;
        message += `\n🕐 Time: ${new Date(lead.createdAt).toLocaleString()}`;
        
        return message;
    }

    /**
     * Send custom WhatsApp message
     */
    async sendMessage(toNumber, messageBody) {
        if (!this.client) {
            console.warn('Twilio not configured. Skipping WhatsApp message.');
            return false;
        }

        try {
            await this.client.messages.create({
                from: `whatsapp:${this.fromNumber}`,
                to: `whatsapp:${toNumber}`,
                body: messageBody
            });

            return true;
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return false;
        }
    }
}

module.exports = new WhatsAppService();
