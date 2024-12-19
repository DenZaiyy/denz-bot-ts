import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllGuilds() {
    try {
        const guilds = await prisma.guild.findMany();
        console.log(guilds);
        return guilds;
    } catch (err) {
        console.error("Error fetching guilds: ", err);
    } finally {
        prisma.$disconnect;
    }
}

export async function getAllMemberFromGuild(guildId: string) {
    try {
        const membersFromGuild = await prisma.member.findMany({
            where: {
                guildId: guildId,
            },
        });
        console.log(membersFromGuild);
        return membersFromGuild;
    } catch (error) {
        console.error("Error fetching member from guild: ", error);
    } finally {
        prisma.$disconnect;
    }
}

export async function getAllStreamLiveFromGuild(guildId: string) {
    try {
        const liveStreamFromGuild = await prisma.live.findMany({
            where: {
                guildId: guildId,
            },
        });
        console.log(liveStreamFromGuild);
        return liveStreamFromGuild;
    } catch (error) {
        console.error("Error fetching streaming live from guild: ", error);
    } finally {
        prisma.$disconnect;
    }
}

export async function getWelcomeChannelFromGuild(guildId: string) {
    try {
        const guild = await prisma.guild.findUnique({
            where: {
                guildId: guildId,
            },
        });

        if (!guild) {
            console.error("Guild not found");
            return null;
        }

        return guild.welcomeChannel;
    } catch (error) {
        console.error("Error fetching welcome channel from guild: ", error);
    } finally {
        prisma.$disconnect;
    }
}
