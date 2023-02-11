export default function handler(req, res) {

    if (req.method == 'POST') {
        res.status(200).json({ 'message': `received event type ${req.body['event']}` })
    }

    res.status(200).json({ 'message': `hit plex API endpoint` })
}