
 /////ФУНКЦИИ ВСЕГДА ВОЗВРАЩАЮТ ПОЛОЖИТЕЛЬНЫЕ ЧИСЛА

function presentValueCalc(uint64 index_, uint104 principalValue_) internal pure returns (uint104) {
    return uint104(uint(principalValue_) * index_ / BASE_INDEX_SCALE);
}



function principalValueSupplyCalc(uint64 sRate_, uint104 presentValue_) internal pure returns (uint104) {
    return uint104((uint(presentValue_) * BASE_INDEX_SCALE) / sRate_);
}

/**
    * @dev The present value projected backward by the borrow index (rounded up)
    */
function principalValueBorrowCalc(uint64 bRate_, uint104 presentValue_) internal pure returns (uint104) {
    return uint104((uint(presentValue_) * BASE_INDEX_SCALE + bRate_ - 1) / bRate_);
}


function presentValue(tuple (sRate, bRate),int104 principalValue_) internal view returns (int256) {
    if (principalValue_ >= 0) {
        return signed256(presentValueCalc(sRate, uint104(principalValue_)));
    } else {
        return -signed256(presentValueCalc(bRate, uint104(-principalValue_)));
    }
}

function principalValue(tuple (sRate, bRate), int256 presentValue_) internal view returns (int104) {
    if (presentValue_ >= 0) {
        return signed104(principalValueSupplyCalc(sRate, uint256(presentValue_)));
    } else {
        return -signed104(principalValueBorrowCalc(bRate, uint256(-presentValue_)));
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
    uint totalSupply_ = presentValueCalc(asset_data.asset.sRate, asset_data.asset.total_supply_principal);

    uint totalBorrow_ = presentValueCalc(asset_data.asset.bRate, asset_data.asset.totalBorrowPrincipal);
    if (totalSupply_ == 0) {
        utilization =  0;
    } else {
        utilization =  totalBorrow_ * FACTOR_SCALE / totalSupply_;
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
    //нужно получить по ключу ассета текущие sRate, bRate (в коде sRate_, bRate_)
    if (timeElapsed > 0) {
        (uint supplyRate, uint borrowRate) = getAssetRates(asset);
        sRate_ += safe64(mulFactor(sRate_, supplyRate * timeElapsed)); // sRate_ * supplyRate * timeElapsed
        bRate_ += safe64(mulFactor(bRate_, borrowRate * timeElapsed));
    }
    return (sRate_, bRate_);
}



function accrueInterest(address asset) internal {
    uint40 now_ = getNowInternal();
    uint timeElapsed = uint256(now_ - asset_data.asset.lastAccrual);
    if (timeElapsed > 0) {
        (sRate, bRate) = getUpdatedRates(asset, timeElapsed);
        lastAccrualTime = now_;
    //нужно сохранить в сторадж lastAccrualTime, sRate, bRate в asset_data_
    }
}

// CALLABLE нужно проверить, что сумма доллоровой стоимости залогов пользователя умноженных на liquidationThreshold меньше чем сумма займа
function isLiquidatable(assetConfig_, asset_data_) override public view returns (bool) {
    borrow_amount = 0
    borrow_limit = 0 
    for asset in assets:
        if asset.principal<0: 
            borrow_amount += presentValueCalc(asset_data_.bRate, -user.asset.principal*asset_data_.price
        else if asset.principal>0:
            borrow_limit += presentValueCalc(asset_data_.sRate, user.asset.principal * asset_data_.price * assetConfig_.liquidationThreshold
    return borrow_limit < borrow_amount
}


function getAvailableToBorrow(assetConfig_, asset_data_) {
    borrow_limit = 0 
    for asset in assets:
        if asset.principal>0: 
            borrow_limit += presentValueCalc(asset_data_.sRate, user.asset.principal * asset_data_.price * assetConfig_.collateralFactor
    return borrow_limit 
}


function isBorrowCollateralized(assetConfig_, asset_data_, user_) returns (bool) {
    borrow_amount = 0
    borrow_limit = 0 
    for asset in assets:
        if asset.principal<0: 
            borrow_amount += presentValueCalc(asset_data_.bRate, -user_.asset.principal)*asset_data_.price
        else if asset.principal>0:
            borrow_limit += presentValueCalc(asset_data_.sRate, user_.asset.principal) * asset_data_.price * assetConfig_.collateralFactor
    return borrow_limit < borrow_amount
}

function supply()  {
    //user, amount, asset берутся из транзакции
    if isActive: // проверить что в конфиге не приостановлен маркет
        accrueInterest(asset);

        int104 dstPrincipal = User.asset.principal;
        int256 dstBalance = presentValue((sRate,bRate), dstPrincipal) + signed256(amount);
        int104 dstPrincipalNew = principalValue((sRate,bRate), dstBalance);

        (uint104 repayAmount, uint104 supplyAmount) = calcSupplyPrincipals(dstPrincipal, dstPrincipalNew);

        asset_data.asset.total_supply_principal += supplyAmount;
        asset_data.asset.totalBorrowPrincipal -= repayAmount;

        user.asset.principal = dstPrincipalNew;

}

function withdraw(address src, uint256 amount, address asset)  {
        
    if isActive:  // проверить что в конфиге не приостановлен маркет


        accrueInterest(asset);

        int104 srcPrincipal = User.asset.principal;
        int256 srcBalance = presentValue((sRate,bRate), srcPrincipal) - signed256(amount);
        int104 srcPrincipalNew = principalValue((sRate,bRate), srcBalance);

        if (srcBalance < 0) {
            if (!isBorrowCollateralized(assetConfig, asset_data)) revert NotCollateralized();
        }

        (uint104 withdrawAmount, uint104 borrowAmount) = calcWithdrawPrincipals(srcPrincipal, srcPrincipalNew);

        asset_data.asset.total_supply_principal -= withdrawAmount;
        asset_data.asset.totalBorrowPrincipal += borrowAmount;

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
        return signed256(presentValueCalc(ratesTuple.sRate, uint104(user.userPrincipal.asset)));
    } else {
        return -signed256(presentValueCalc(ratesTuple.bRate, uint104(-user.userPrincipal.asset)));
    }
}


function getAssetTotals(address asset) {
    uint40 now_ = getNowInternal();
    uint timeElapsed = uint256(now_ - asset_data.asset.lastAccrual);
    (sRate, bRate) = getUpdatedRates(asset, timeElapsed)
    totalSupply = presentValueCalc(asset_data.Asset.sRate, asset_data.Asset.total_supply_principal)
    totalBorrow = presentValueCalc(asset_data.Asset.bRate, asset_data.Asset.totalBorrowPrincipal)
    return (totalSupply, totalBorrow)
}

//децимал соответствует децималу коллатерала
function getCollateralQuote(address borrowToken, address collateralToken, uint amount) override public view returns (uint) {
    AssetInfo memory assetInfo = getAssetInfoByAddress(asset);
    uint256 assetPrice = getPrice(collateralToken);
    uint256 assetPriceDiscounted = mulFactor(assetPrice, SCALE - asset_data.borrowToken.liquidationPenalty);
    uint256 basePrice = getPrice(borrowToken);
    // # of collateral assets
    // = (TotalValueOfBaseAmount / DiscountedPriceOfCollateralAsset) * assetScale
    // = ((basePrice * baseAmount / baseScale) / assetPriceDiscounted) * assetScale
    return basePrice * amount * collateralTokenDecimal / assetPriceDiscounted / borrowTokenDecimal;
}



function getAssetReserves(asset) override public view returns (int) {
    (uint64 sRate, uint64 bRate) = accruedInterestIndices(getNowInternal() - asset_data.asset.lastAccrualTime);
    uint balance = ERC20(baseToken).balanceOf(address(this));
    uint totalSupply_ = presentValueSupply(sRate, asset_data.asset.total_supply_principal);
    uint totalBorrow_ = - presentValueBorrow(bRate, asset_data.asset.totalBorrowPrincipal);
    return signed256(balance) - signed256(totalSupply_) + signed256(totalBorrow_);
}


function liquidate(borrower: address, collateralToken: address, minCollateralAmount: uint64) override external {
    if isActive:
        accrueInterest(asset);
        if (!isLiquidatable(assetConfig, asset_data)) revert NotLiquidable();

        collateralAmount = getCollateralQuote(transferredToken, collateralToken, amountTransferred);
        if (collateralAmount < minCollateralAmount) revert TooMuchSlippage();

        collateralPrincipal = userData.collateralToken

        collateralBalance = presentValueCalc((sRate,bRate), collateralPrincipal)

        if (collateralAmount > collateralBalance) revert NotEnoughCollateral();

        newCollateralBalance = collateralBalance - collateralAmount

        newCollateralPrincipal = principalValue((collateralToken.sRate,collateralToken.bRate), newCollateralBalance);

        collateralTokenLiquidationPrincipal = newCollateralPrincipal - collateralPrincipal

        
        debtTokenPrincipal = userData.transferredToken

        debtTokenBalance = presentValue((transferredToken.sRate,transferredToken.bRate), userData.transferredToken)

        newDebtTokenBalance = debtTokenBalance + amountTransferred

        newDebtTokenPrincipal = principalValue((sRate,bRate), newDebtTokenBalance);

        (uint104 repayAmount, uint104 supplyAmount) = calcSupplyPrincipals(debtTokenPrincipal, newDebtTokenPrincipal);



        user.collateralToken.principal = newCollateralPrincipal

        user.transferredToken.principal = newDebtTokenPrincipal



        asset_data.transferredToken.total_supply_principal += supplyAmount;
        asset_data.transferredToken.totalBorrowPrincipal -= repayAmount;
        asset_data.collateralToken.total_supply_principal -= collateralTokenLiquidationPrincipal;           

        ERC20(asset).transfer(caller, safe128(collateralAmount))

}

