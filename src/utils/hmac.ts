import crypto from "crypto"
import { TWITCH_MESSAGE_ID, TWITCH_MESSAGE_TIMESTAMP } from "./variables"

// Build the message used to get the HMAC.
export function getHmacMessage(request: Request | any) {
	return (
		request.headers[TWITCH_MESSAGE_ID] +
		request.headers[TWITCH_MESSAGE_TIMESTAMP] +
		request.body
	)
}

export function getHmac(secret: string, message: string) {
	return crypto.createHmac("sha256", secret).update(message).digest("hex")
}

export function verifyMessage(hmac: string, verifySignature: string | any) {
	return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature))
}
