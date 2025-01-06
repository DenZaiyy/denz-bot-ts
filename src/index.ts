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
import { updateLive } from "./utils/twitch"

const port = 3000

const app = express()

app.use(
	express.raw({
		type: "application/json",
	}),
	cors()
)

app.get("/", (req, res) => {
	//console.log(twitchAPI.createSubscription("chrisd_tv"))
	//res.send("Subscription testings")
	res.send("Welcome to node.js app")
})

app.listen(port, () => {
	console.log(`server using port : ${port}`)
})

app.post("/twitch/webhook", (req, res) => {
	let secret = config.TWITCH_SECRET
	let message = getHmacMessage(req)
	let hmac = HMAC_PREFIX + getHmac(secret, message) // Signature to compare

	if (!verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
		console.log("signatures don't match")
		res.sendStatus(403)
		return
	}

	// Get JSON object from body, so you can process the message.
	let notification = JSON.parse(req.body)

	const notificationType = notification.subscription.type
	const username = notification.event.broadcaster_user_name

	console.log(notificationType, username)

	if (notificationType === "stream.online") {
		console.log("Stream is online")
		updateLive(username, true)
	} else if (notificationType === "stream.offline") {
		console.log("Stream is offline")
		updateLive(username, false)
	} else {
		console.log(`Unhandled event type: ${notificationType}`)
	}

	if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
		// TODO: Do something with the event's data.

		// send message to annoucement channel of discord bot
		console.log("test")

		console.log(`Event type: ${notification.subscription.type}`)
		console.log(JSON.stringify(notification.event, null, 4))

		res.sendStatus(204)
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
})
