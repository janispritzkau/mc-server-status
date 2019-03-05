# Minecraft Server Status Checker

A small utility for getting the description, player count and ping of
a Minecraft server.

## Usage

```bash
mc-status eu.mineplex.com
# with port
mc-status localhost:25565
```

![Terminal output](https://gitlab.com/janispritzkau/mc-status/raw/master/terminal.png)

You can also use it as a library:

```js
const { getStatus } = require("mc-server-status")

getStatus("eu.mineplex.com").then(response => {
    console.log(response)
})
```
