# EVAA | Evaa Protocol Smart Contracts | Hack-a-TONx w/ DoraHacks
Welcome to EVAA - Evaa Protocol smart cotntracts  GitHub repository! This repository contains the smartcontracts for the first lending protocol on TON blockchain.

EVAA Protocol is the first decentralized non-custodial lending protocol uniquely designed for the TON blockchain. Liquidity is provided to the market by depositors in order to earn passive income, whereas borrowers are able to obtain overcollateralized loans. At the MVP stage, it allows for lending and borrowing TON, oETH, oUSDT, oUSDC, and oWBTC. 

![Evaa Protocol](assets/evaa_smarts_git.png)

Smart contracts is written using `FunC`


## Architecture

### Terminology
All user balances stored in the smart contracts (smart contracts are named hereafter SC) are discounted to the moment of the protocol launch and are referred to principals further. Positive and negative principal value determines deposit and debt respectively. sRate and bRate are the discount rates required to track interest accrued on supply and borrow principals since the market pool launch.

### Description
EVAA is built according to the TON development convention and has no boundless data structures. The core component of the protocol is the master SC. It stores and calculates common for all users data such as protocol configuration, total supply and borrow principals, and asset variables. The master contract deploys a user SC with the first user interaction. This SC stores and calculates data that is specific to the user. 
All updates of user balances come through the Withdraw and Liquidate methods, and direct TON/Jettons transfer to the protocol address that serves as the Supply method. There are no “Repay” and “Borrow” methods, these actions can be carried out with “Supply” and Withdraw respectively.

1. The first master call updates the discount rates – sRate and bRate.
2. The consequent user SC call verifies if the transaction is allowed from the user account perspective (e.g. in the case of Withdraw if the borrow is collateralized), updates the user’s principals, and calculates increments of Total principals. Withdraw and Liquidate calls lock user SC until mater SC confirms that the transaction is completed.
3. If the method involves sending jettons, the last master SC call verifies if there is enough liquidity for the transaction. Finally, master &SC updates protocol’s jetton balances, and writes updated Total principals.
4. The last user SC call is for unlocking the user contract (only within Withdraw and Liquidate transactions)

### Getters Evaa Protocol
https://docs.google.com/spreadsheets/d/16ILyjRzRv8DgOqjQRbJqXj-wSYAZsEj3vI_WafEvbXk/edit?usp=sharing

### Scheme of SC interactions
https://miro.com/app/board/uXjVMcSbNyw=/?share_link_id=873476038218


## Development
Install environment https://ton.org/docs/develop/smart-contracts/environment/installation

- `yarn - install dependences`
- `yarn start - tests & compile`
- `yarn deploy:testnet` - will deploy SC to testnet


## Contacts 
If you want to contribute or found a bug, write here on telegram please -  https://t.me/sepezho 


