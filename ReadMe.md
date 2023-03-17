# EVAA | Evaa Protocol Smart Contracts | Hack-a-TONx w/ DoraHacks
Welcome to EVAA - Evaa Protocol smart cotntracts  GitHub repository! This repository contains the smartcontracts for the first lending protocol on TON blockchain.

![Evaa Protocol](assets/evaa_smarts_git.png)

Smart contracts is written using `FunC`

EVAA Protocol is the first decentralized non-custodial lending protocol uniquely designed for the TON blockchain. Liquidity is provided to the market by depositors in order to earn passive income, whereas borrowers are able to obtain overcollateralized loans. At the MVP stage, it allows for lending and borrowing TON, oETH, oUSDT, oUSDC, and oWBTC. 

## Contacts 
If you want to contribute or found a bug, write here on telegram please -  https://t.me/sepezho 


----------- 


# OLD

Документ пока что очень сырой

# Терминология

## Master

### asset_config_collection
Словарь: ассет -> `asset_config`

### asset_config
Конфиг конкретного ассета, который задается при его инициализации и не изменяется (админ ток может сменить если оч надо)
+ collateralFactor
+ liquidationThreshold
+ ...

### asset_dynamics_collection
Словарь: ассет -> `asset_dynamics`

### asset_dynamics
Информация о текущих изменяющихся данных (sRate, bRate и т.п.),
относящихся к конкретному ассету


## User (лучше Wallet? по аналогии с жетонами)

### user_principals
Словарь: ассет -> баланс (положительный для вкладов и отрицательный для долгов)

## Various

`asset_id` ≈ `asset_master_hash`
It's an address hash of the corresponding jetton's master smart contract in most cases, but it's a special constant in the case of TON itself.



