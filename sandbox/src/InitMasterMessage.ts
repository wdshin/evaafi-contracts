import { beginCell, Cell, Dictionary } from "ton";

import { op } from "./OpCodes.js";
import { AssetConfig } from "./AssetConfigCollection.js";
import { AssetDynamics } from "./AssetDynamicsCollection.js";
import { customBuilder } from "./CustomBuilder.js";


export function packInitMasterMessage(
	assetConfigCollection: Dictionary<bigint, AssetConfig>,
	assetDynamicsCollection: Dictionary<bigint, AssetDynamics>,
) {
	return customBuilder()
		.storeOpCode(op.init_master)
		.storeQueryId(0)
		.storeDict(assetConfigCollection)
		.storeDict(assetDynamicsCollection)
		// Warning: there is a slight mismatch:
		// this would add two extra 1 bits
		.endCell();
}
