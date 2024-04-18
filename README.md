# denZ-BOT

## Description

denz-Bot is a Discord bot built using TypeScript and the discord.js library.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/denz-bot.git
    ```

2. Install dependencies using pnpm:

    ```bash
    pnpm install
    ```

## Configuration

1. Create a new Discord application and bot on the [Discord Developer Portal](https://discord.com/developers/applications).

2. Copy `.env.example` file and name it `.env` for load available environment variables correctly

3. Copy the bot token and paste it in the `.env` file:

    ```plaintext
    DISCORD_TOKEN=your-bot-token
    ```

4. Copy the bot client id and paste it in the `.env` file:

    ```plaintext
    DISCORD_CLIENT_ID=your-client-id
    ```

## Usage

After install & build typescript files, you can launch the bot using this command:

1. To simple start bot with existing files:

    ```bash
    pnpm start
    ```

2. To restart bot with every changes:
    ```bash
    pnpm dev
    ```

You can evently build typescript files everytime file are changed:

1. To simple build ts files:

    ```bash
    pnpm build
    ```

2. To build everytime files change:
    ```bash
    pnpm watch
    ```
