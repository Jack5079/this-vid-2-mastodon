import { Masto } from 'masto'
import { existsSync as exists, readFileSync as readFile } from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'
// turns out dotenv doesn't work with modules so uhh
if (exists('./.env')) {
  // Before anything uses it, we must load the .env file (provided it exists, of course)
  process.env = {
    ...process.env, // Preserve existing env
    ...Object.fromEntries(
      // Overwrite the env with the .env file
      readFile('./.env', 'utf-8')
        .split('\n') // split the file into lines
        .filter((line: string) => !line.startsWith('#')) // remove comments
        .filter(Boolean) // remove spacing
        .map((line: string) => line.split('=')) // split the lines into key:value pairs
    )
  }
}

async function main () {
  const masto = await Masto.login({
    accessToken: process.env.TOKEN,
    uri: 'https://this-is-epic.space' // optional, defaults to https://mastodon.social/api/v1/
  })

  const stream = await masto.streamPublicTimeline()

  // Subscribe to updates
  stream.on('update', async status => {
    if (status.mentions[0]?.username === 'this_vid2') {
      if (status.mediaAttachments[0]?.type === 'video') {
        // A video is attached
        const url = status.mediaAttachments[0]?.url
        const file = await fetch(url).then((res) => res.buffer())
        var fd = new FormData()
        fd.append("video", file)
        const downdata = await fetch("https://projectlounge.pw/thisvid2/upload", {
          method: "post",
          body: fd
        }).then(res => res.json())
        if (!downdata.error) {
          const downloaded = fetch(downdata.data).then(res => res.buffer())
          const attachment = await masto.createMediaAttachment({
            file: downloaded,
            description: 'funny video',
          })

          masto.createStatus({
            status: "Here's the video!",
            visibility: 'public',
            mediaIds: [attachment.id],
            inReplyToId: status.id
          })
        }
      }
    }
  })
}
main().catch(console.error)
