import { Address, beginCell, Cell, Dictionary } from "ton";

import { userCodeCell } from "./SmartContractsCells.js";


const emptyDict = Dictionary.empty();

export function packMasterData(adminAddress: Address): Cell {
	return beginCell()
		.storeRef(beginCell().storeBuffer(Buffer.from('Main evaa pool.')).endCell())
		.storeRef(userCodeCell)
		.storeRef(
			beginCell()
			.storeDict(emptyDict)
			.storeInt(-1, 8)
			.storeAddress(adminAddress)
			.storeDict(emptyDict)
			.endCell()
		)
		.storeDict(emptyDict)
		.endCell();
}
