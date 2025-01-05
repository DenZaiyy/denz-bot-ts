import express, { Request } from "express"
import crypto from "crypto"
import { config } from "./config"
import { prisma, twitchAPI } from "./utils/variables"
import cors from "cors"

import * as https from "https"
import * as http from "http"
import * as fs from "fs"
const app = express()

const privateKey = fs.readFileSync("./config/server.key", "utf8")
const certificate = fs.readFileSync("./config/server.crt", "utf8")

const credentials = {
	key: privateKey,
	cert: certificate,
	passphrase: config.SSL_PASSPHRASE,
}

// Redirection HTTP -> HTTPS
http
	.createServer((req, res) => {
		res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` })
		res.end()
	})
	.listen(80, () => {
		console.log("Redirection HTTP -> HTTPS en cours sur http://localhost")
	})

const httpsServer = https.createServer(credentials, app)

httpsServer.listen(443, () => {
	console.log(`Server is running on port 443, https://localhost:443`)
})

app.use(
	express.raw({
		// Need raw message body for signature verification
		type: "application/json",
	}),
	cors()
)

app.get("/", (req, res) => {
	console.log(twitchAPI.createSubscription("chrisd_tv"))
	res.send("Subscription testings")
})
/* 
app.listen(8080, () => {
    console.log(`Server is running on port 8080, https://localhost:8080`);
}); */

// Notification request headers
const TWITCH_MESSAGE_ID = "Twitch-Eventsub-Message-Id".toLowerCase()
const TWITCH_MESSAGE_TIMESTAMP =
	"Twitch-Eventsub-Message-Timestamp".toLowerCase()
const TWITCH_MESSAGE_SIGNATURE =
	"Twitch-Eventsub-Message-Signature".toLowerCase()
const MESSAGE_TYPE = "Twitch-Eventsub-Message-Type".toLowerCase()

// Notification message types
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification"
const MESSAGE_TYPE_NOTIFICATION = "notification"
const MESSAGE_TYPE_REVOCATION = "revocation"

// Prepend this string to the HMAC that's created from the message
const HMAC_PREFIX = "sha256="

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

// Build the message used to get the HMAC.
function getHmacMessage(request: Request | any) {
	return (
		request.headers[TWITCH_MESSAGE_ID] +
		request.headers[TWITCH_MESSAGE_TIMESTAMP] +
		request.body
	)
}

function getHmac(secret: string, message: string) {
	return crypto.createHmac("sha256", secret).update(message).digest("hex")
}

function verifyMessage(hmac: string, verifySignature: string | any) {
	return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature))
}

async function updateLive(channel: string, date: boolean) {
	try {
		await prisma.live.updateMany({
			where: { channel },
			data: { streamDate: date ? new Date() : null },
		})
	} catch (error) {
		console.error(`Failed to update live status for ${channel}:`, error)
	}
}
