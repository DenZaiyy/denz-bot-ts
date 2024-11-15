import {config} from "./config";

export default class TwitchAPI {
    private readonly _clientID: string;
    private readonly _clientSecret: string;

    constructor(clientID: string, clientSecret: string) {
        this._clientID =  clientID;
        this._clientSecret = clientSecret;
    }

    private async getTwitchToken() {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: this._clientID,
                client_secret: this._clientSecret,
                grant_type: "client_credentials",
            })
        });
        return await response.json().then((data) => {
            return data['access_token'];
        });
    }

    public async getTwitchIDFromUsername(username: string) {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this._clientID,
                'Authorization': `Bearer ${await this.getTwitchToken()}`
            }
        })

        return await response.json().then((data) => {
            console.log(data.data[0].id);
            return data.data[0].id;
        });
    }

    public async createSubscription() {
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Client-ID': this._clientID,
                'Authorization': `Bearer ${await this.getTwitchToken()}`
            },
            body: JSON.stringify({
                type: 'stream.online',
                version: '1',
                condition: {
                    broadcaster_user_id: await this.getTwitchIDFromUsername(config.TWITCH_CHANNEL)
                },
                transport: {
                    method: 'webhook',
                    callback: 'https://denzaiyytv.loca.lt/twitch/webbook'G
                }
            })
        })

        return await response.json().then((data) => {
            console.log(data);
            return data;
        });
    }
}