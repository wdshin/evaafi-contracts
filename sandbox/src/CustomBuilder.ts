import { Builder } from "ton-core";

export class CustomBuilder extends Builder {
	// Common TON store operations
	storeBool(value: boolean | number | bigint): CustomBuilder {
		this.storeInt(value == 0 ? 0 : -1, 1);
		return this;
	}

	storeOpCode(opCode: number | bigint): CustomBuilder {
		this.storeUint(opCode, 32);
		return this;
	}
	storeQueryId(queryId: number | bigint): CustomBuilder {
		this.storeUint(queryId, 64);
		return this;
	}

	// Project-specific store operations
	storePrice(price: number | bigint): CustomBuilder {
		this.storeUint(price, 64);
		return this;
	}
	storeAddressHash(addressHash: number | bigint): CustomBuilder {
		this.storeUint(addressHash, 256);
		return this;
	}
	storeAssetId(assetId: number | bigint): CustomBuilder {
		this.storeUint(assetId, 256);
		return this;
	}
	storeAmount(amount: number | bigint): CustomBuilder {
		this.storeUint(amount, 64);
		return this;
	}
	storeBalance(balance: number | bigint): CustomBuilder {
		this.storeUint(balance, 64);
		return this;
	}
	storeSBrate(sbRate: number | bigint): CustomBuilder {
		this.storeUint(sbRate, 64);
		return this;
	}
	storePrincipal(principal: number | bigint): CustomBuilder {
		this.storeInt(principal, 64);
		return this;
	}
	storeTimestamp(timestamp: number | bigint): CustomBuilder {
		this.storeUint(timestamp, 32);
		return this;
	}
}

export function customBuilder() {
	return new CustomBuilder();
}
