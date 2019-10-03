import { Client, PacketWriter } from "mcproto"

export interface Status {
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
    ping?: number
}

export const getStatus = async (host: string, port?: number, checkPing = true): Promise<Status> => {
    const client = await Client.connect(host, port)

    client.send(new PacketWriter(0x0).writeVarInt(404)
        .writeString(host).writeUInt16(client.socket.remotePort!).writeVarInt(1))

    client.send(new PacketWriter(0x0))

    const status: Status = (await client.nextPacket()).readJSON()

    if (checkPing) {
        client.send(new PacketWriter(0x1).write(Buffer.alloc(8)))
        const start = Date.now()

        await client.nextPacket(0x1)
        status.ping = Date.now() - start
    }

    client.end()

    return status
}
