import { Connection, PacketWriter } from "mcproto"
import * as chat from "mc-chat-format"
import { connect } from "net"
import * as dns from "dns"

async function main() {
    const args = process.argv.slice(2)
    let [host, portStr] = (args[0] || "").split(":")

    if (!host) console.error("Please specify the server address"), process.exit(1)

    let port = parseInt(portStr)
    if (!port) await new Promise((res, rej) => {
        dns.resolveSrv("_minecraft._tcp." + host, (err, addrs) => {
            port = err || addrs.length == 0 ? 25565 : addrs[0].port, res()
        })
    })

    const socket = connect({ host, port }, async () => {
        const client = new Connection(socket)

        client.send(new PacketWriter(0x0).writeVarInt(-1)
        .writeString(host).writeUInt16(port).writeVarInt(1))
        client.send(new PacketWriter(0x0))

        const status = (await client.nextPacket()).readJSON()

        console.log("\n" + chat.format(status.description, { useAnsiCodes: true }) + "\n")
        console.log(`\x1b[1mVersion: \x1b[0m ${status.version.name} (${status.version.protocol})`)
        console.log(`\x1b[1mPlayers: \x1b[0m ${status.players.online}/${status.players.max}`)
        console.log(`\x1b[1mFavicon: \x1b[0m ${
            status.favicon ? `yes, ${status.favicon.length} bytes` : "no"
        }`)

        client.send(new PacketWriter(0x1).write(Buffer.alloc(8)))
        const start = Date.now()

        await client.nextPacketWithId(0x1)
        const ping = Date.now() - start

        socket.end()

        console.log(`\x1b[1mPing:    \x1b[0m ${ping} ms`)
    })
}

main().catch(err => console.error(err))
