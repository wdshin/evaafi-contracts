import { Address, beginCell, Cell } from "ton-core";

import { randomAddress } from "./utils";


export function packMasterData(userCodeCell: Cell, adminAddress: Address) {
	return beginCell()
		.storeRef(beginCell().storeBuffer(new Buffer('Main evaa pool.')).endCell())
		.storeRef(userCodeCell)
		.storeRef(
			beginCell()
			.storeDict(beginDict(256).endDict())
			.storeInt(-1, 8)
			.storeAddress(adminAddress)
			.storeDict(beginDict(256).endDict())
			.endCell()
		)
		.storeDict(beginDict(256).endDict())
		.endCell();
}
