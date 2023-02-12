

const getImageFromPlex = async (thumbUri) => {
    const image = await request.get({
        uri: thumbUri,
        encoding: null
    })
    return image
}

export default function handler(req, res) {
    const eventType = JSON.parse(req.body.payload)['event'];

    if (eventType == 'media.play') {
        // console.log(req);


        if (req.files) {
            console.log(req.files[0].buffer)
        }
    }



    if (req.method == 'POST') {
        const eventType = JSON.parse(req.body.payload)['event'];
        // console.log(JSON.parse(req.body.payload))

        if (req.file && req.file.buffer) {
            console.log('event has image')
            const buffer = req.file.buffer;
            console.log(buffer)
        }

        // if (req['Metadata']['thumb']) {
        //     const image = getImageFromPlex(req['Metadata']['thumb']);
        //     console.log(image);
        // }


        console.log(eventType)
    }
    res.status(200).json({ 'message': `hit plex API endpoint` })
}