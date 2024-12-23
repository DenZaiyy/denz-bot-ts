import { config } from "./config";

export default class TwitchAPI {
    private readonly _clientID: string;
    private readonly _clientSecret: string;

    constructor(clientID: string, clientSecret: string) {
        this._clientID = clientID;
        this._clientSecret = clientSecret;
    }

    public async getTwitchOAuthToken() {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: this._clientID,
                client_secret: this._clientSecret,
                grant_type: "client_credentials",
            }),
        });
        return await response.json().then((data) => {
            return data["access_token"];
        });
    }

    public async getTwitchIDFromUsername(username: string) {
        const response = await fetch(
            `https://api.twitch.tv/helix/users?login=${username}`,
            {
                method: "GET",
                headers: {
                    "Client-ID": this._clientID,
                    Authorization: `Bearer ${await this.getTwitchOAuthToken()}`,
                },
            }
        );

        return await response.json().then((data) => {
            console.log(data.data[0].id);
            return data.data[0].id;
        });
    }

    public async createSubscription() {
        const events = ["stream.online", "stream.offline"];
        events.map(async (event) => {
            const response = await fetch(
                "https://api.twitch.tv/helix/eventsub/subscriptions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Client-ID": this._clientID,
                        Authorization: `Bearer ${await this.getTwitchOAuthToken()}`,
                    },
                    body: JSON.stringify({
                        type: event,
                        version: "1",
                        condition: {
                            broadcaster_user_id:
                                await this.getTwitchIDFromUsername(
                                    config.TWITCH_CHANNEL
                                ),
                        },
                        transport: {
                            method: "webhook",
                            callback:
                                "https://twelve-geese-bathe.loca.lt/twitch/webhook",
                            secret: config.TWITCH_SECRET,
                        },
                    }),
                }
            );

            if (response.status >= 300) {
                console.error("Failed to create subscription", response);
            }
        });
    }
}
