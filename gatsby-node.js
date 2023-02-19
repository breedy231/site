const { createFileNodeFromBuffer } = require("gatsby-source-filesystem")

exports.sourceNodes = ({actions, createNodeId, getCache}) => {
  if (process.env.INCOMING_HOOK_BODY) {
    // Source plex thumbnail from Netlify build hook
    const thumbnailBufferEncoded =
      process.env.INCOMING_HOOK_BODY.split('=')[1]

    const {createNode} = actions;

    const thumbnailBuffer = Buffer.from(thumbnailBufferEncoded, 'base64')
    createFileNodeFromBuffer({
      buffer: thumbnailBuffer,
      getCache: getCache,
      createNode: createNode,
      createNodeId: createNodeId,
      name: "plexThumbnail",
      ext: '.jpg'
    })
  }
}
