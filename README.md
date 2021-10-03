<h3 align="center">Gompei Bot</h3>
<p align="center">Discord bot created for the (unofficial) WPI Discord Server<p>

---

## About
Gompei is a community driven bot created for the (unofficial) WPI Discord Server. This is a rewrite of the [original bot](https://github.com/SamuelCurrid/Gompei-Bot).

## Development

### Setup

If not already installed, go to [https://nodejs.org/en/]() and install the "current" version. You may alternatively want to use a node package manager, such as `nvm` or `n`. [Click here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm) for more information.

1. Run `npm install`.
2. Copy `TEMPLATE.env` to a new file called `.env`. Do not check this file into git.
3. Update `.env` with your bot token and any other configuration you want.

And you're done!

### `npm run dev`

This will launch a development server which includes a typescript watch and will recompile and reload the bot on every change. Compiled code will be stored in the `dist` directory.

### `npm run build`

This will build bot into the `dist` directory.

### `npm run start`

This will run the bot from the `dist` directory. The bot must have been built first.

### `npm run watch`

This will create a typescript watch that will recompile the code on every change and emit it to the `dist` directory. Note that this command will not run the bot.
