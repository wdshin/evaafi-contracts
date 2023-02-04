;; TODO write formula for apy and stuff 

;; -----
;; DOCS
;; borrow interest rate
;; if U < Uopt :
;; Rt = R0 + Ut / Uopt * Rslope1 
;; if U >= Uopt :
;; Rt = R0 + Rslope1 + (Ut - Uopt) / (1 - Uopt) * Rslope2

;; -----
;; ChatGPT
;; lending IR
;; r = k * (1 - (S / (B + S)))
;; r = interest rate
;; k = a constant that determines the target interest rate
;; S = total supply of the asset in the pool
;; B = total borrows of the asset in the pool

;; For landing and borrow APR
;; APR = (1 + r/n)^n - 1 ? 

;; borrow IR
;; r = r0 * (1 + k * (u - u0))
;; 
;; Where:
;; 
;; r0 is the initial interest rate for a specific asset.
;; k is the interest rate slope parameter for that asset.
;; u is the current utilization rate for that asset, i.e., the ratio of borrowed amount to the available liquidity for that asset.
;; u0 is the utilization rate at which the interest rate is equal to r0.
;; 
;; Health Factor (HF) = (Liq / Borrows) * Exp(-Decay * t)
;; 
;; Where:
;; 
;; Liq is the available liquidity for a specific asset.
;; Borrows is the total amount of that asset that has been borrowed.
;; Decay is a parameter that determines the rate of decay for the health factor over time.
;; t is the time elapsed since the last update to the health factor.


