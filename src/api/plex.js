import axios from "axios"

export default async function handler(req, res) {
  if (req.method == "POST") {
    const eventType = JSON.parse(req.body.payload)["event"]
    if (eventType == "media.play") {
      if (req.files.length > 0) {
        // Format image thumbnail as a base-64 URLEncoded string
        const thumbnailBuffer = req.files[0].buffer
        const payload = {
          thumbnailBufferEncoded: thumbnailBuffer.toString("base64"),
        }

        // Send POST request to build hook
        try {
          const result = await axios
            .post(
              `https://api.netlify.com/build_hooks/${process.env.MAIN_BUILD_HOOK_ID}`,
              payload,
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            )
            .then(res => {
              return res
            })
          res.status(200).json({message: 'triggered site build', data: result.data})
        } catch (error) {
          res.status(500).send(error)
        }
      }
    }
  }

  res.status(200).json({ message: `hit plex API endpoint` })
}
