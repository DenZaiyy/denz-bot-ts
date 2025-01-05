import { PrismaClient } from "@prisma/client";
import TwitchAPI from "../twitchAPI";
import { config } from "../config";

export const prisma = new PrismaClient();

export const twitchAPI = new TwitchAPI(
  config.TWITCH_CLIENT_ID,
  config.TWITCH_CLIENT_SECRET,
);
