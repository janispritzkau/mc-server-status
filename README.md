# Minecraft Server Status

A small utility and library for getting the description, player count
and ping of a Minecraft server.

## Usage

```bash
mc-status 2b2t.org
# with port
mc-status localhost:25565

# output json
mc-status --json <address>
```

![Terminal output](https://gitlab.com/janispritzkau/mc-status/raw/master/terminal.png)

You can also use it as a library:

```js
const { getStatus } = require("mc-server-status")

const status = await getStatus("2b2t.org")
console.log(status)
```
