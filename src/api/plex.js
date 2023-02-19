import axios from "axios"

export default async function handler(req, res) {
  if (req.method == "POST") {
    const eventType = JSON.parse(req.body.payload)["event"]

    if (eventType == "media.play") {
      console.log("in play event")
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
              "https://api.netlify.com/build_hooks/63e946b0744a8f42bee25c24",
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
          res.json(result)
        } catch (error) {
          res.status(500).send(error)
        }
      }
    }
  }

  res.status(200).json({ message: `hit plex API endpoint` })
}
