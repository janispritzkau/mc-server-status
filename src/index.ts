import { Client, PacketWriter, State } from "mcproto"

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

export interface StatusOptions {
    /** @default true */
    checkPing?: boolean
    /** @default 5000 // ms */
    timeout?: number
    /** @default 736 // 1.16.1 */
    protocol?: number
}

const defaultOptions: Partial<StatusOptions> = {
    checkPing: true,
    timeout: 5000,
    protocol: 736
}

export async function getStatus(host: string, port?: number | null, options?: StatusOptions): Promise<Status> {
    options = { ...defaultOptions, ...options }

    const client = await Client.connect(host, port, {
        connectTimeout: options.timeout,
        timeout: options.timeout
    })

    client.send(new PacketWriter(0x0).writeVarInt(options.protocol!)
        .writeString(host).writeUInt16(client.socket.remotePort!)
        .writeVarInt(State.Status))

    client.send(new PacketWriter(0x0))

    const status: Status = (await client.nextPacket()).readJSON()

    if (options.checkPing) {
        client.send(new PacketWriter(0x1).write(Buffer.alloc(8)))
        const start = Date.now()

        await client.nextPacket(0x1)
        status.ping = Date.now() - start
    }

    client.end()

    return status
}
