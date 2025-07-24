# Noodlify ![Discord.js](https://img.shields.io/badge/discord.js-v14-blue) ![Node.js](https://img.shields.io/badge/node-%3E=18-green) ![License](https://img.shields.io/badge/license-ISC-lightgrey)

> **me bored so i made dis, verify bot tha tmakes you send an image to verify...**

---

## Features

- **Photo verify**: users use image to verify.
- **Staff Review**: Staff can approve/deny applications, with command and stuff.
- **Blacklisting**: block users from applying with reasons and more blabla.
- **Cooldowns**: yeah just cooldowns.
- **Ephemeral**: messages only visible to u.
- **Database in JSON**: history blacklsits applications etc are stored in json files.
- **Images**: verification images are saved, but pretty sure this doesnt work lol.
- **Roles**: gives removes roles an idk.
- **Configurable**: config file and ur bot info in a `.env` file nad admin commands for the database files.

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/bloker0000/Noodlify.git
cd Noodlify
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root directory (see `.env.example` for reference):

```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_guild_id
STAFF_CHANNEL_ID=your_staff_channel_id
VERIFY_CHANNEL_ID=your_verify_channel_id
VERIFIED_ROLE_ID=your_verified_role_id
UNVERIFIED_ROLE_ID=your_unverified_role_id
STAFF_ROLE_ID=your_staff_role_id
```

> **yeah and prob dont share the `.env` file or ur token and stuff**

### 4. Deploy Commands

```bash
npm run deploy
```

### 5. Start the Bot

```bash
npm start
```

---

## Configuration

Configuration is done via the `.env` file or `config.js` file. u can find ur bot info in the discord dev portal.

- **TOKEN**: ur bot token
- **CLIENT_ID**: bot client ID
- **GUILD_ID**: server ID where the bot will be in
- **STAFF_CHANNEL_ID**: channel for staff notifs and reviews
- **VERIFY_CHANNEL_ID**: channel where users start verification
- **VERIFIED_ROLE_ID**: role given when successful verification
- **UNVERIFIED_ROLE_ID**: role for users not verified
- **STAFF_ROLE_ID**: role required to use staff commands

---

## Project Structure

```
Noodlify/
├── data/                # folder with all data files
├── src/
│   ├── commands/        # folder with command stuff
│   ├── events/          # event listeners
│   ├── modules/         # verification, staff review, modal logic
│   ├── utils/           # helpers, database, cooldown, ephemeral, etc.
│   ├── index.js         # main bot entry point
│   └── deploy-commands.js # command registration script
├── .env                 # Environment vars
├── .gitignore
├── package.json
└── README.md
```

---

## Usage

- **/applications**: staff command to view open applications
- **/history**: view history from a user or all users
- **/blacklist**: add, remove, or list blacklisted users
- **/bulk-manage deny-all**: deny al pending applications
- **/toggle-verification**: enable or disable the verification system
- **/lookup**: look up user verification applications
- **/admin-db**: for managing data like removing it
- **/export or import data**: for exporting or importing bot data
---

## Credits

- Built with [discord.js](https://discord.js.org/)
- Made by noodlll3 on Discord
- [noodle](https://noodlesareyummy.xyz/)

---