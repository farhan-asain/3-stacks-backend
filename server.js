const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json());

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

app.post('/api/place-order', async (req, res) => {
    const order = req.body;
    console.log('Received Order:', JSON.stringify(order, null, 2));

    if (!SLACK_WEBHOOK_URL) {
        console.error('Slack Webhook URL is not configured on the server!');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

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
    // Build the customer details fields dynamically
    const customerFields = [
        { "type": "mrkdwn", "text": `*Customer:*\n${order.customer.name}` },
        { "type": "mrkdwn", "text": `*Phone:*\n${order.customer.phone}` },
        { "type": "mrkdwn", "text": `*Address:*\n${order.customer.address}` }
    ];

    if (order.customer.landmark) {
        customerFields.push({ "type": "mrkdwn", "text": `*Landmark:*\n${order.customer.landmark}` });
    }

    // Build the main message blocks
    let blocks = [
        {
            "type": "header",
            "text": { "type": "plain_text", "text": "🍔 New Order Received! 🍔" }
        },
        {
            "type": "section",
            "fields": customerFields
        },
        { "type": "divider" }
    ];

    // Add order items
    let itemsText = order.items.map(item => 
        `• *${item.quantity}x* ${item.name} - ${item.price.toFixed(2)} AED`
    ).join('\n');
    
    blocks.push({
        "type": "section",
        "text": { "type": "mrkdwn", "text": `*Order Details:*\n${itemsText}` }
    });

    // Add special instructions ONLY if they exist and are not empty
    if (order.specialInstructions && order.specialInstructions.trim() !== '') {
        blocks.push(
            { "type": "divider" },
            {
                "type": "section",
                "text": { "type": "mrkdwn", "text": `*Special Instructions:*\n> ${order.specialInstructions}` }
            }
        );
    }
    
    // Add the total price at the end
    blocks.push(
        { "type": "divider" },
        {
            "type": "section",
            "text": { "type": "mrkdwn", "text": `*TOTAL: ${order.totalPrice.toFixed(2)} AED*` }
        }
    );

    return { blocks };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});