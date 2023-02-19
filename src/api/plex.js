import axios from "axios"
const isUrlSafe = char => {
  return /[a-zA-Z0-9\-_~.]+/.test(char)
}

const urlEncodeBytes = buf => {
  let encoded = ""
  for (let i = 0; i < buf.length; i++) {
    const charBuf = Buffer.from("00", "hex")
    charBuf.writeUInt8(buf[i])
    const char = charBuf.toString()
    // if the character is safe, then just print it, otherwise encode
    if (isUrlSafe(char)) {
      encoded += char
    } else {
      encoded += `%${charBuf.toString("hex").toUpperCase()}`
    }
  }
  return encoded
}

export default async function handler(req, res) {
  if (req.method == "POST") {
    const eventType = JSON.parse(req.body.payload)["event"]

    if (eventType == "media.play") {
      console.log('in play event')
      if (req.files.length > 0) {
        // Save thumbnail buffer file & event metadata markdown file
        const thumbnailBuffer = req.files[0].buffer

        // const encoded = urlEncodeBytes(thumbnailBuffer)
        console.log(thumbnailBuffer.toString('base64'))

        const payload = {
          thumbnailBufferEncoded: thumbnailBuffer.toString('base64')
        }

        // Send POST request to build hook
        try {
          const result = await axios.post(
            "https://api.netlify.com/build_hooks/63e946b0744a8f42bee25c24",
            payload,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          ).then((res) => {
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
