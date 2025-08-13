const express = require('express');
const axios = require('axios');
const app = express();

// This allows your website (from a different domain) to send requests to this server.
const cors = require('cors');
app.use(cors()); 

app.use(express.json());

// IMPORTANT: PASTE YOUR SECRET SLACK WEBHOOK URL HERE
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000...';

// This creates the "door" for our kitchen. The website will send orders to this exact URL path.
app.post('/api/place-order', async (req, res) => {
    const order = req.body;
    console.log('Received Order:', JSON.stringify(order, null, 2));

    // Basic validation to ensure we have a valid order
    if (!order || !order.customer || !order.items || order.items.length === 0) {
        return res.status(400).json({ message: 'Invalid order data.' });
    }

    // Format the order data into a pretty Slack message
    const slackMessage = formatOrderForSlack(order);

    try {
        // Use axios to send the formatted message to Slack
        await axios.post(SLACK_WEBHOOK_URL, slackMessage);
        console.log('Order sent to Slack successfully!');
        
        // Send a "Success" message back to the website so the customer knows it worked.
        res.status(200).json({ message: 'Order received successfully!' });
    } catch (error) {
        console.error('Error sending to Slack:', error.message);
        // If it fails, send an error message back to the website.
        res.status(500).json({ message: 'Failed to send order notification.' });
    }
});

// This function just organizes the data to look good in Slack
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

// This tells the server to start listening for requests on a specific port.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});