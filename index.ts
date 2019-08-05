import { Client, PacketWriter } from "mcproto"
import * as chat from "mc-chat-format"

export interface Response {
    version: {
        name: string
        protocol: number
    }
    players: {
        max: number
        online: number
    }
    description: string
    favicon?: string
    ping: number
}

export const getStatus = async (host: string, port?: number): Promise<Response> => {
    const client = await Client.connect(host, port)

    client.send(new PacketWriter(0x0).writeVarInt(404)
        .writeString(host).writeUInt16(port!).writeVarInt(1))

    client.send(new PacketWriter(0x0))

    const status = (await client.nextPacket()).readJSON()
    client.send(new PacketWriter(0x1).write(Buffer.alloc(8)))
    const start = Date.now()

    await client.nextPacket(0x1)
    const ping = Date.now() - start

    client.end()
    return { ...status, ping }
}

export async function main() {
    let useJson = false, addr = null
    for (const arg of process.argv.slice(2)) {
        if (arg == "--json") useJson = true
        else addr = arg
    }
    let [host, portStr] = (addr || "").split(":")

    if (!host) return console.error("Please specify the server address")

    const port = parseInt(portStr)

    let status: Response
    try {
        status = await getStatus(host, port)
    } catch (err) {
        const match = err.message.match(/ECONNREFUSED (.+)/)
        if (match) {
            console.error(`Could not connect to ${match[1]}`)
        } else {
            console.error(err.message)
        }
        return
    }

    if (useJson) return console.log(JSON.stringify(status, null, 2))

    console.log("\n" + chat.format(status.description, { useAnsiCodes: true }) + "\n")
    console.log(`\x1b[1mVersion: \x1b[0m ${status.version.name} (${status.version.protocol})`)
    console.log(`\x1b[1mPlayers: \x1b[0m ${status.players.online}/${status.players.max}`)
    console.log(`\x1b[1mFavicon: \x1b[0m ${
        status.favicon ? `yes, ${status.favicon.length} bytes` : "no"
    }`)
    console.log(`\x1b[1mPing:    \x1b[0m ${status.ping} ms\n`)
}
