const { createFileNodeFromBuffer } = require("gatsby-source-filesystem")

const urlDecodeBytes = encoded => {
  let decoded = Buffer.from("")
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === "%") {
      const charBuf = Buffer.from(`${encoded[i + 1]}${encoded[i + 2]}`, "hex")
      decoded = Buffer.concat([decoded, charBuf])
      i += 2
    } else {
      const charBuf = Buffer.from(encoded[i])
      decoded = Buffer.concat([decoded, charBuf])
    }
  }
  return decoded
}

exports.sourceNodes = () => {
  if (process.env.INCOMING_HOOK_BODY) {
    // Source plex thumbnail from Netlify build hook
    console.log('incoming hook body',  process.env.INCOMING_HOOK_BODY)
    const thumbnailBufferEncoded =
      process.env.INCOMING_HOOK_BODY["thumbnailBufferEncoded"]
    console.log('thumbnailBufferEncoded', thumbnailBufferEncoded)

    const thumbnailBuffer = urlDecodeBytes(thumbnailBufferEncoded)
    createFileNodeFromBuffer({
      buffer: thumbnailBuffer,
      name: "plexThumbnail",
    })
  }
}
