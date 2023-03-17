import { beginCell, Cell } from "ton-core";

import { op } from "./OpCodes";


export function packInitMasterMessage(
	assetConfigCollection: Cell,
	assetDynamicsCollection: Cell,
) {
	return beginCell()
		.storeUint(op.init_master, 32)
		.storeUint(0, 64)
		.storeRef(assetConfigCollection)
		.storeRef(assetDynamicsCollection)
		.endCell();
}
