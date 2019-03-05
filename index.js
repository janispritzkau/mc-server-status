"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcproto_1 = require("mcproto");
const chat = require("mc-chat-format");
const net_1 = require("net");
const dns = require("dns");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        let [host, portStr] = (args[0] || "").split(":");
        if (!host)
            console.error("Please specify the server address"), process.exit(1);
        let port = parseInt(portStr);
        if (!port)
            yield new Promise((res, rej) => {
                dns.resolveSrv("_minecraft._tcp." + host, (err, addrs) => {
                    port = err || addrs.length == 0 ? 25565 : addrs[0].port, res();
                });
            });
        const socket = net_1.connect({ host, port }, () => __awaiter(this, void 0, void 0, function* () {
            const client = new mcproto_1.Connection(socket);
            client.send(new mcproto_1.PacketWriter(0x0).writeVarInt(-1)
                .writeString(host).writeUInt16(port).writeVarInt(1));
            client.send(new mcproto_1.PacketWriter(0x0));
            const status = (yield client.nextPacket()).readJSON();
            console.log("\n" + chat.format(status.description, { useAnsiCodes: true }) + "\n");
            console.log(`\x1b[1mVersion: \x1b[0m ${status.version.name} (${status.version.protocol})`);
            console.log(`\x1b[1mPlayers: \x1b[0m ${status.players.online}/${status.players.max}`);
            console.log(`\x1b[1mFavicon: \x1b[0m ${status.favicon ? `yes, ${status.favicon.length} bytes` : "no"}`);
            client.send(new mcproto_1.PacketWriter(0x1).write(Buffer.alloc(8)));
            const start = Date.now();
            yield client.nextPacketWithId(0x1);
            const ping = Date.now() - start;
            socket.end();
            console.log(`\x1b[1mPing:    \x1b[0m ${ping} ms`);
        }));
    });
}
main().catch(err => console.error(err));
