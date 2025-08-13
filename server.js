const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// IMPORTANT: PASTE YOUR SECRET SLACK WEBHOOK URL HERE
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

// This is the endpoint your front-end will send orders to
app.post('/api/place-order', async (req, res) => {
    const order = req.body;
    console.log('Received Order:', JSON.stringify(order, null, 2));

    if (!order || !order.customer || !order.items || order.items.length === 0) {
        return res.status(400).json({ message: 'Invalid order data.' });
    }

    const slackMessage = formatOrderForSlack(order);

    try {
        await axios.post(SLACK_WEBHOOK_URL, slackMessage);
        console.log('Order sent to Slack successfully!');
        res.status(200).json({ message: 'Order received successfully!' });
    } catch (error) {
        console.error('Error sending to Slack:', error.message);
        res.status(500).json({ message: 'Failed to send order notification.' });
    }
});

function formatOrderForSlack(order) {
    let itemsText = order.items.map(item => {
        let itemLine = `• *${item.quantity}x* ${item.name} - ${item.price.toFixed(2)} AED`;
        if (item.notes) {
            itemLine += `\n\t :memo: _Notes: ${item.notes}_`;
        }
        return itemLine;
    }).join('\n');

    return {
        blocks: [
            {
                "type": "header",
                "text": { "type": "plain_text", "text": "🍔 New Order Received! 🍔" }
            },
            {
                "type": "section",
                "fields": [
                    { "type": "mrkdwn", "text": `*Customer:*\n${order.customer.name}` },
                    { "type": "mrkdwn", "text": `*Phone:*\n${order.customer.phone}` }
                ]
            },
            { "type": "divider" },
            {
                "type": "section",
                "text": { "type": "mrkdwn", "text": `*Order Details:*\n${itemsText}` }
            },
            { "type": "divider" },
            {
                "type": "section",
                "text": { "type": "mrkdwn", "text": `*TOTAL: ${order.totalPrice.toFixed(2)} AED*` }
            }
        ]
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});