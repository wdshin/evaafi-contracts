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



