import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, toNano } from "ton-core";

// export type NftCollectionData = {
// 	nextItemIndex: number
// 	content: Cell
// 	owner: Address
// }

export class LendingMaster implements Contract {
	static readonly code = Cell.fromBase64('asdf')

	readonly address: Address;
	readonly init: { code: Cell; data: Cell; };
	// nextItemIndex: number;

	constructor(workchain: number, initParams: {
		admin: Address
		nextItemIndex?: number
		content?: Cell
		itemCode?: Cell
		royaltyParams?: Cell
	}) {
		this.nextItemIndex = initParams.nextItemIndex ?? 0
		const data = beginCell()
			.storeAddress(initParams.owner)
			.storeUint(this.nextItemIndex, 64)
			.storeRef(initParams.content ?? beginCell().storeRef(new Cell()))
			.storeRef(initParams.itemCode ?? NftItem.code)
			.storeRef(initParams.royaltyParams ?? new Cell())
			.endCell()
		this.init = { code: NftCollection.code, data }
		this.address = contractAddress(workchain, this.init)
	}

	async sendMint(provider: ContractProvider, via: Sender, to: Address, params?: Partial<{
		value: bigint
		itemValue: bigint
		content: Cell
	}>) {
		const index = this.nextItemIndex++
		await provider.internal(via, {
			value: params?.value ?? toNano('0.05'),
			body: beginCell()
				.storeUint(1, 32) // op
				.storeUint(0, 64) // query id
				.storeUint(index, 64)
				.storeCoins(params?.itemValue ?? toNano('0.02'))
				.storeRef(beginCell()
					.storeAddress(to)
					.storeRef(params?.content ?? new Cell()))
				.endCell()
		})
		return index
	}

	async getItemAddress(provider: ContractProvider, index: number): Promise<Address> {
		const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: BigInt(index) }])
		return res.stack.readAddress()
	}

	async getCollectionData(provider: ContractProvider): Promise<NftCollectionData> {
		const { stack } = await provider.get('get_collection_data', [])
		return {
			nextItemIndex: stack.readNumber(),
			content: stack.readCell(),
			owner: stack.readAddress(),
		}
	}
}
