
 /////ФУНКЦИИ ВСЕГДА ВОЗВРАЩАЮТ ПОЛОЖИТЕЛЬНЫЕ ЧИСЛА

function presentValueCalc(uint64 index_, uint104 principalValue_) internal pure returns (uint104) {
    return uint104(uint(principalValue_) * index_ / BASE_INDEX_SCALE);
}



function principalValueSupplyCalc(uint64 s_rate_, uint104 presentValue_) internal pure returns (uint104) {
    return uint104((uint(presentValue_) * BASE_INDEX_SCALE) / s_rate_);
}

/**
    * @dev The present value projected backward by the borrow index (rounded up)
    */
function principalValueBorrowCalc(uint64 b_rate_, uint104 presentValue_) internal pure returns (uint104) {
    return uint104((uint(presentValue_) * BASE_INDEX_SCALE + b_rate_ - 1) / b_rate_);
}


function presentValue(tuple (s_rate, b_rate),int104 principalValue_) internal view returns (int256) {
    if (principalValue_ >= 0) {
        return signed256(presentValueCalc(s_rate, uint104(principalValue_)));
    } else {
        return -signed256(presentValueCalc(b_rate, uint104(-principalValue_)));
    }
}

function principalValue(tuple (s_rate, b_rate), int256 presentValue_) internal view returns (int104) {
    if (presentValue_ >= 0) {
        return signed104(principalValueSupplyCalc(s_rate, uint256(presentValue_)));
    } else {
        return -signed104(principalValueBorrowCalc(b_rate, uint256(-presentValue_)));
    }
}

//////calcSupplyPrincipals
function calcSupplyPrincipals(int104 oldPrincipal, int104 newPrincipal) internal pure returns (uint104, uint104) {
    // If the new principal is less than the old principal, then no amount has been repaid or supplied
    if (newPrincipal < oldPrincipal) return (0, 0);

    if (newPrincipal <= 0) {
        return (uint104(newPrincipal - oldPrincipal), 0);
    } else if (oldPrincipal >= 0) {
        return (0, uint104(newPrincipal - oldPrincipal));
    } else {
        return (uint104(-oldPrincipal), uint104(newPrincipal));
    }
}


//////calcWithdrawPrincipals
function calcWithdrawPrincipals(int104 oldPrincipal, int104 newPrincipal) internal pure returns (uint104, uint104) {
    // If the new principal is greater than the old principal, then no amount has been withdrawn or borrowed
    if (newPrincipal > oldPrincipal) return (0, 0);

    if (newPrincipal >= 0) {
        return (uint104(oldPrincipal - newPrincipal), 0);
    } else if (oldPrincipal <= 0) {
        return (0, uint104(oldPrincipal - newPrincipal));
    } else {
        return (uint104(oldPrincipal), uint104(-newPrincipal));
    }
}



function getAssetRates(asset) {
    //все переменные участвующие в рассчете ставки берутся из ассет конфига для соответствующего ассета
    uint totalSupply_ = presentValueCalc(asset_dynamics_collection.asset.s_rate, asset_dynamics_collection.asset.total_supply_principal);

    uint total_borrow_ = presentValueCalc(asset_dynamics_collection.asset.b_rate, asset_dynamics_collection.asset.total_borrow_principal);
    if (totalSupply_ == 0) {
        utilization =  0;
    } else {
        utilization =  total_borrow_ * FACTOR_SCALE / totalSupply_;
    }
    if (utilization <= targetUtilization) {
        //  interestRateSlopeLow * utilization
        supplyRate =  safe64(mulFactor(supplyPerSecondInterestRateSlopeLow, utilization));
    } else {
        // interestRateSlopeLow * kink + interestRateSlopeHigh * (utilization - kink)
        supplyRate =  safe64(mulFactor(supplyPerSecondInterestRateSlopeLow, targetUtilization) + mulFactor(supplyPerSecondInterestRateSlopeHigh, (utilization - targetUtilization)));
    }
    if (utilization <= targetUtilization) {
        // interestRateBase + interestRateSlopeLow * utilization
        borrowRate = safe64(borrowPerSecondInterestRateBase + mulFactor(borrowPerSecondInterestRateSlopeLow, utilization));
    } else {
        // interestRateBase + interestRateSlopeLow * kink + interestRateSlopeHigh * (utilization - kink)
        borrowRate = safe64(borrowPerSecondInterestRateBase + mulFactor(borrowPerSecondInterestRateSlopeLow, targetUtilization) + mulFactor(borrowPerSecondInterestRateSlopeHigh, (utilization - targetUtilization)));
    }
    return (supplyRate, borrowRate)
}

////accruedRates
function getUpdatedRates(address asset, uint timeElapsed) returns (uint64, uint64) {
    //нужно получить по ключу ассета текущие s_rate, b_rate (в коде s_rate_, b_rate_)
    if (timeElapsed > 0) {
        (uint supplyRate, uint borrowRate) = getAssetRates(asset);
        s_rate_ += safe64(mulFactor(s_rate_, supplyRate * timeElapsed)); // s_rate_ * supplyRate * timeElapsed
        b_rate_ += safe64(mulFactor(b_rate_, borrowRate * timeElapsed));
    }
    return (s_rate_, b_rate_);
}



function accrueInterest(address asset) internal {
    uint40 now_ = getNowInternal();
    uint timeElapsed = uint256(now_ - asset_dynamics_collection.asset.lastAccrual);
    if (timeElapsed > 0) {
        (s_rate, b_rate) = getUpdatedRates(asset, timeElapsed);
        lastAccrualTime = now_;
    //нужно сохранить в сторадж lastAccrualTime, s_rate, b_rate в asset_data_
    }
}

// CALLABLE нужно проверить, что сумма доллоровой стоимости залогов пользователя умноженных на liquidationThreshold меньше чем сумма займа
function isLiquidatable(asset_config_, asset_data_) override public view returns (bool) {
    borrow_amount = 0
    borrow_limit = 0 
    for asset in assets:
        if asset.principal<0: 
            borrow_amount += presentValueCalc(asset_data_.b_rate, -user.asset.principal*asset_data_.price
        else if asset.principal>0:
            borrow_limit += presentValueCalc(asset_data_.s_rate, user.asset.principal * asset_data_.price * asset_config_.liquidationThreshold
    return borrow_limit < borrow_amount
}


function getAvailableToBorrow(asset_config_, asset_data_) {
    borrow_limit = 0 
    for asset in assets:
        if asset.principal>0: 
            borrow_limit += presentValueCalc(asset_data_.s_rate, user.asset.principal * asset_data_.price * asset_config_.collateralFactor
    return borrow_limit 
}


function isBorrowCollateralized(asset_config_, asset_data_, user_) returns (bool) {
    borrow_amount = 0
    borrow_limit = 0 
    for asset in assets:
        if asset.principal<0: 
            borrow_amount += presentValueCalc(asset_data_.b_rate, -user_.asset.principal)*asset_data_.price
        else if asset.principal>0:
            borrow_limit += presentValueCalc(asset_data_.s_rate, user_.asset.principal) * asset_data_.price * asset_config_.collateralFactor
    return borrow_limit < borrow_amount
}


// ---------------------------------------------------------------- code below needed to be implemented in utils.fc
// ---------------------------------------------------------------- code below needed to be implemented in utils.fc
// ---------------------------------------------------------------- code below needed to be implemented in utils.fc
// ---------------------------------------------------------------- code below needed to be implemented in utils.fc


function supply()  {
    //user, amount, asset берутся из транзакции
    if isActive: // проверить что в конфиге не приостановлен маркет
        accrueInterest(asset);

        int104 dstPrincipal = User.asset.principal;
        int256 dstBalance = presentValue((s_rate,b_rate), dstPrincipal) + signed256(amount);
        int104 dstPrincipalNew = principalValue((s_rate,b_rate), dstBalance);

        (uint104 repayAmount, uint104 supplyAmount) = calcSupplyPrincipals(dstPrincipal, dstPrincipalNew);

        asset_dynamics_collection.asset.total_supply_principal += supplyAmount;
        asset_dynamics_collection.asset.total_borrow_principal -= repayAmount;

        user.asset.principal = dstPrincipalNew;

}

function withdraw(address src, uint256 amount, address asset)  {
        
    if isActive:  // проверить что в конфиге не приостановлен маркет


        accrueInterest(asset);

        int104 srcPrincipal = User.asset.principal;
        int256 srcBalance = presentValue((s_rate,b_rate), srcPrincipal) - signed256(amount);
        int104 srcPrincipalNew = principalValue((s_rate,b_rate), srcBalance);

        if (srcBalance < 0) {
            if (!isBorrowCollateralized(asset_config, asset_dynamics_collection)) revert NotCollateralized();
        }

        (uint104 withdrawAmount, uint104 borrowAmount) = calcWithdrawPrincipals(srcPrincipal, srcPrincipalNew);

        asset_dynamics_collection.asset.total_supply_principal -= withdrawAmount;
        asset_dynamics_collection.asset.total_borrow_principal += borrowAmount;

        user.asset.principal = dstPrincipalNew;


}

function withdrawReserves(address asset, address to, uint amount) override external {
    if (msg.sender != admin) revert Unauthorized();

    int reserves = getAssetReserves(asset);
    if (reserves < 0 || amount > unsigned256(reserves)) revert InsufficientReserves();

    doTransferOut(asset, to, amount);
}


function getAccountAssetBalance(asset, ratesTuple) {
    if (user.userPrincipal.asset >= 0) {
        return signed256(presentValueCalc(ratesTuple.s_rate, uint104(user.userPrincipal.asset)));
    } else {
        return -signed256(presentValueCalc(ratesTuple.b_rate, uint104(-user.userPrincipal.asset)));
    }
}

//done in func
function getAssetTotals(address asset) {
    uint40 now_ = getNowInternal();
    uint timeElapsed = uint256(now_ - asset_dynamics_collection.asset.lastAccrual);
    (s_rate, b_rate) = getUpdatedRates(asset, timeElapsed)
    totalSupply = presentValueCalc(asset_dynamics_collection.Asset.s_rate, asset_dynamics_collection.Asset.total_supply_principal)
    total_borrow = presentValueCalc(asset_dynamics_collection.Asset.b_rate, asset_dynamics_collection.Asset.total_borrow_principal)
    return (totalSupply, total_borrow)
}

//done func
//децимал соответствует децималу коллатерала
function getCollateralQuote(address borrowToken, address collateralToken, uint amount) override public view returns (uint) {
    AssetInfo memory assetInfo = getAssetInfoByAddress(asset);
    uint256 assetPrice = getPrice(collateralToken);
    uint256 assetPriceDiscounted = mulFactor(assetPrice, SCALE - asset_dynamics_collection.borrowToken.liquidationPenalty);
    uint256 basePrice = getPrice(borrowToken);
    // # of collateral assets
    // = (TotalValueOfBaseAmount / DiscountedPriceOfCollateralAsset) * assetScale
    // = ((basePrice * baseAmount / baseScale) / assetPriceDiscounted) * assetScale
    return basePrice * amount * collateralTokenDecimal / assetPriceDiscounted / borrowTokenDecimal;
}


//done func
function getAssetReserves(asset) override public view returns (int) {
    (uint64 s_rate, uint64 b_rate) = accruedInterestIndices(getNowInternal() - asset_dynamics_collection.asset.lastAccrualTime);
    uint balance = ERC20(baseToken).balanceOf(address(this));
    uint totalSupply_ = presentValueSupply(s_rate, asset_dynamics_collection.asset.total_supply_principal);
    uint total_borrow_ = - presentValueBorrow(b_rate, asset_dynamics_collection.asset.total_borrow_principal);
    return signed256(balance) - signed256(totalSupply_) + signed256(total_borrow_);
}


function liquidate(borrower: address, collateralToken: address, minCollateralAmount: uint64) override external {
    if isActive:
        accrueInterest(asset);
        if (!isLiquidatable(asset_config, asset_dynamics_collection)) revert NotLiquidable();

        collateralAmount = getCollateralQuote(transferredToken, collateralToken, amountTransferred);
        if (collateralAmount < minCollateralAmount) revert TooMuchSlippage();

        collateralPrincipal = userData.collateralToken

        collateralBalance = presentValueCalc((s_rate,b_rate), collateralPrincipal)

        if (collateralAmount > collateralBalance) revert NotEnoughCollateral();

        newCollateralBalance = collateralBalance - collateralAmount

        newCollateralPrincipal = principalValue((collateralToken.s_rate,collateralToken.b_rate), newCollateralBalance);

        collateralTokenLiquidationPrincipal = newCollateralPrincipal - collateralPrincipal

        
        debtTokenPrincipal = userData.transferredToken

        debtTokenBalance = presentValue((transferredToken.s_rate,transferredToken.b_rate), userData.transferredToken)

        newDebtTokenBalance = debtTokenBalance + amountTransferred

        newDebtTokenPrincipal = principalValue((s_rate,b_rate), newDebtTokenBalance);

        (uint104 repayAmount, uint104 supplyAmount) = calcSupplyPrincipals(debtTokenPrincipal, newDebtTokenPrincipal);



        user.collateralToken.principal = newCollateralPrincipal

        user.transferredToken.principal = newDebtTokenPrincipal


        // asset_data not yet renamed to asset_dynamics_collection because it's usage was not immediately obvious
        asset_data.transferredToken.total_supply_principal += supplyAmount;
        asset_data.transferredToken.total_borrow_principal -= repayAmount;
        asset_data.collateralToken.total_supply_principal -= collateralTokenLiquidationPrincipal;           

        ERC20(asset).transfer(caller, safe128(collateralAmount))

}

