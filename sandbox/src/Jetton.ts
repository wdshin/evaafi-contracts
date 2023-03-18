import { Address } from "ton-core";

import { customBuilder } from "./CustomBuilder.js";
import { op } from "./OpCodes.js";


export const JettonSendTonAttachment = 50_000_000n;

export function packTransferNotification(
	queryId: number | bigint,
	jettonAmount: number | bigint,
	fromAddress: Address,
) {
	return customBuilder()
		.storeOpCode(op.transfer_notification)
		.storeQueryId(queryId)
		.storeCoins(jettonAmount)
		.storeAddress(fromAddress)
		.endCell();
}
