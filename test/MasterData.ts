import { Address, beginCell, beginDict, Cell } from "ton";

export function packMasterData(userCodeCell: Cell, adminAddress: Address): Cell {
	return beginCell()
		.storeRef(beginCell().storeBuffer(new Buffer('Main evaa testnet pool #1.')).endCell())
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
