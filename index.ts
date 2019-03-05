import { Connection, PacketWriter } from "mcproto"
import * as chat from "mc-chat-format"
import { connect } from "net"
import * as dns from "dns"

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

export const getStatus = (host: string, port?: number) => new Promise<Response>(async (res, rej) => {
    if (!port) port = await new Promise<number>(resolve => {
        dns.resolveSrv("_minecraft._tcp." + host, (err, addrs) => {
            resolve(err || addrs.length == 0 ? 25565 : addrs[0].port)
        })
    })

    const socket = connect({ host, port }, async () => {
        const client = new Connection(socket)
        client.onError = rej

        client.send(new PacketWriter(0x0).writeVarInt(404)
        .writeString(host).writeUInt16(port!).writeVarInt(1))
        client.send(new PacketWriter(0x0))

        const status = (await client.nextPacket()).readJSON()

        client.send(new PacketWriter(0x1).write(Buffer.alloc(8)))
        const start = Date.now()

        await client.nextPacketWithId(0x1)
        const ping = Date.now() - start

        socket.end()
        res({ ...status, ping })
    })
    socket.on("close", () => rej(new Error("Connection closed by server")))
    socket.on("error", rej)
})

export async function main() {
    const args = process.argv.slice(2)
    let [host, portStr] = (args[0] || "").split(":")

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

    console.log("\n" + chat.format(status.description, { useAnsiCodes: true }) + "\n")
    console.log(`\x1b[1mVersion: \x1b[0m ${status.version.name} (${status.version.protocol})`)
    console.log(`\x1b[1mPlayers: \x1b[0m ${status.players.online}/${status.players.max}`)
    console.log(`\x1b[1mFavicon: \x1b[0m ${
        status.favicon ? `yes, ${status.favicon.length} bytes` : "no"
    }`)
    console.log(`\x1b[1mPing:    \x1b[0m ${status.ping} ms\n`)
}

