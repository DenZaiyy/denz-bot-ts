import express from "express"
import { config } from "./config"
import {
	HMAC_PREFIX,
	MESSAGE_TYPE,
	MESSAGE_TYPE_NOTIFICATION,
	MESSAGE_TYPE_REVOCATION,
	MESSAGE_TYPE_VERIFICATION,
	TWITCH_MESSAGE_SIGNATURE,
	twitchAPI,
} from "./utils/variables"
import cors from "cors"
import { getHmac, getHmacMessage, verifyMessage } from "./utils/hmac"
import { twitchEventTrigger, updateLive } from "./utils/twitch"

const port = 3000

const app = express()

app.use(
	express.raw({
		type: "application/json",
	}),
	cors()
)

app.get("/", async (req, res) => {
	console.log('Deleting all subscriptions:', await twitchAPI.deleteAllSubscriptions())
	/* console.log(twitchAPI.createSubscription("denzdev"))
	console.log(
		"Exists subscriptions root express:",
		await twitchAPI.getExistingSubscriptions()
	) */
	//res.send("Subscription testings")
	res.send("Welcome to node.js app")
})

app.listen(port, () => {
	console.log(`server using port : ${port}`)
})

app.post("/twitch/webhook", async (req, res) => {
	try {
		const secret = config.TWITCH_SECRET
		const message = getHmacMessage(req)
		const hmac = HMAC_PREFIX + getHmac(secret, message) // Signature to compare

		if (!verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
			console.log("signatures don't match")
			res.sendStatus(403)
			return
		}

		// Check req.body before init notification variable
		if (!req.body) {
			console.log("Body is empty")
			res.sendStatus(400)
			return
		}

		// Get JSON object from body, so you can process the message.
		const notification = JSON.parse(req.body)

		if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
			// TODO: Do something with the event's data.

			try {
				const username = notification.event.broadcaster_user_name
				const eventType = notification.subscription.type

				// update live date for stream
				if (eventType === "stream.online") {
					console.log(`Streamer ${username} is online`)
					await updateLive(username, true)
					await twitchEventTrigger()
				} else if (eventType === "stream.offline") {
					console.log(`Streamer ${username} is offline`)
					await updateLive(username, false)
				}

				console.log(`Event type: ${eventType}`)
				console.log(JSON.stringify(notification.event, null, 4))

				res.sendStatus(204)
			} catch (error) {
				console.error("We have error with event : ", error)
			}
		} else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
			res
				.set("Content-Type", "text/plain")
				.status(200)
				.send(notification.challenge)
		} else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
			res.sendStatus(204)

			console.log(`${notification.subscription.type} notifications revoked!`)
			console.log(`reason: ${notification.subscription.status}`)
			console.log(
				`condition: ${JSON.stringify(
					notification.subscription.condition,
					null,
					4
				)}`
			)
		} else {
			res.sendStatus(204)
			console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`)
		}
	} catch (error: any) {
		console.error("Error in POST route:", error.message)
		res.status(400).json({ error: error.message })
	}
})
