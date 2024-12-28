import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET,
    TWITCH_SECRET,
    TWITCH_CHANNEL,
    API_URL,
} = process.env;

if (
    !DISCORD_TOKEN ||
    !DISCORD_CLIENT_ID ||
    !TWITCH_CLIENT_ID ||
    !TWITCH_CLIENT_SECRET ||
    !TWITCH_SECRET ||
    !TWITCH_CHANNEL ||
    !API_URL
) {
    throw new Error(
        "Missing environement variables. Please check your .env file."
    );
}

export const config = {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET,
    TWITCH_SECRET,
    TWITCH_CHANNEL,
    API_URL,
};
