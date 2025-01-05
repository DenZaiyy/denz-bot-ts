import { config } from "./config"

export default class TwitchAPI {
	private readonly _clientID: string
	private readonly _clientSecret: string

	constructor(clientID: string, clientSecret: string) {
		this._clientID = clientID
		this._clientSecret = clientSecret
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
		})
		return await response.json().then((data) => {
			return data["access_token"]
		})
	}

	public async checkIfChannelExist(username: string) {
		const response = await fetch(
			`https://api.twitch.tv/helix/users?login=${username}`,
			{
				method: "GET",
				headers: {
					"Client-ID": this._clientID,
					Authorization: `Bearer ${await this.getTwitchOAuthToken()}`,
				},
			}
		)

		return response.json()
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
		)

		return await response.json().then((data) => {
			console.log(
				`Twitch ID from username (${username}), typeOfID (${typeof data.data[0].id}): `,
				data.data[0].id
			)
			return data.data[0].id
		})
	}

	public async getExistingSubscriptions() {
		const response = await fetch(
			"https://api.twitch.tv/helix/eventsub/subscriptions",
			{
				headers: {
					"Client-ID": this._clientID,
					Authorization: `Bearer ${await this.getTwitchOAuthToken()}`,
				},
			}
		)
		return await response.json()
	}

	public async createSubscription(twitchChannel: string) {
		// Vérifier les souscriptions existantes
		const existingSubs = await this.getExistingSubscriptions()

		const events = ["stream.online", "stream.offline"]

		const twitchID = await this.getTwitchIDFromUsername(twitchChannel)
		const OAuthToken = await this.getTwitchOAuthToken()

		for (const event of events) {
			// Vérifier si la souscription existe déjà

			/* const existingSub = existingSubs.data?.find(
                    (sub: any) =>
                        sub.type === event &&
                        sub.status === "enabled" &&
                        sub.condition.broadcaster_user_id === twitchID
                ); */

			/* if (existingSub) {
                console.log(`Subscription for ${event} already exists`);
                return;
            } */

			try {
				const response = await fetch(
					"https://api.twitch.tv/helix/eventsub/subscriptions",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Client-ID": this._clientID,
							Authorization: `Bearer ${OAuthToken}`,
						},
						body: JSON.stringify({
							type: event,
							version: "1",
							condition: {
								broadcaster_user_id: twitchID,
							},
							transport: {
								method: "webhook",
								callback: `${config.API_URL}/twitch/webhook`, // Utilisez une URL publique configurée
								secret: config.TWITCH_SECRET,
							},
						}),
					}
				)

				const data = await response.json()

				console.log("condition: ", data.condition.broadcaster_user_id)

				if (response.status >= 300) {
					console.error(`Failed to create subscription for ${event}:`, data)
				} else {
					console.log(`Successfully created subscription for ${event}:`, data)
				}
			} catch (error) {
				console.error(`Error creating subscription for ${event}:`, error)
			}
		}
	}
}
