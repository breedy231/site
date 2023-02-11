export default function handler(req, res) {

    if (req.method == 'POST') {
        const eventType = JSON.parse(req.body.payload)['event'];
        res.status(200).json({ 'message': `received event type ${eventType}` })
    }

    res.status(200).json({ 'message': `hit plex API endpoint` })
}