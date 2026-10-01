########################################################################
# - Financial extended third layer for TRISK model 
########################################################################
#Definition of variables 
  #csh - external assets (vector)
  #Shock - decrease in external assets (vector)
  #L - liabilities matrix (matrix)
  #EL - external liabilities (vector)

#Parameters for Distress Valuation
  #R - loss given default (vector)
  #k - capital cushion (vector)
  #a - beta parameter (vector)
  #b - beta parameter (vector)

#Merton and Black-Scholes valuation function
  #EVol - structural asset firm volatility  
  #Type - Type of valuation function 
  #Time - Maturity of firm debt 

########################################################################
#Valuation function 
########################################################################
#Difference in firm liabilities and assets (if in default)
DeltaDiff <- function(Rcsh, REL, RL, RAInt){
  return(REL + rowSums(RL) - (Rcsh + RAInt))
}

#Distress valuation function
IntVal <- function(L, EL, OE, k, R, a, b){
  Frac <- 1 + OE/(rowSums(L) + EL) #capital ratio
  Frac[is.infinite(Frac)] <- 0
  Frac[is.na(Frac)] <- 0
  #Conditional cases for k 
  ifelse(k==0, 
  ifelse(Frac >= 1, 1, 0),#if no cushion, no change for firm not in default 
  ifelse(Frac >= 1+k, 1, 0) + ifelse(Frac >= 1 & Frac < 1+k, (1-R*pbeta((1+k-Frac)/k, a, b)), 0) #otherwise
  )
}

#Merton valuation function (inclusion of loss given default)
Merton <- function(ExtA, OE2, R, vol, maturity){
  Lev <- OE2/ExtA #equity relative to external assets
  Val <- ifelse(Lev >= 1, 1, pnorm((log(1/(1-Lev)) - vol^2*maturity/2)/(vol*maturity^0.5)))
  return(1-R*(1-Val))
}

#Black-Cox valuation function (inclusion of loss given default, this is an extra valuation function)
BlackCox <- function(ExtA, OE2, R, vol, maturity){
  Lev <- OE2/ExtA #equity relative to external assets
  Val <- ifelse(Lev >= 1, 1,
               ifelse(Lev >= 0 & Lev < 1,
               pnorm((log(1/(1-Lev)) - vol^2*maturity/2)/(vol*maturity^0.5))
               - (1/(1-Lev))*pnorm((-log(1/(1-Lev)) - vol^2*maturity/2)/(vol*maturity^0.5)),
               0))
  return(1-R*(1-Val))
}

########################################################################
# Equity reevaluation function
########################################################################
#Reevaluation function for equity changes 
NetTool <- function(csh, Shock, L, EL, R, k, a, b, EVol, Type, Time){
  
  ListEqVal <- list() #store changes in equity
  E <- csh + rowSums(t(L)) - rowSums(L) - EL #initialise equity values
  OIntVal <- rep(1, nrow(L)) #initialise valuation values on internal assets

  ListEqVal <- append(ListEqVal, list(E)) #record initial equity
  E <- csh - Shock + rowSums(t(L)) - rowSums(L) - EL #equity with external shock
  
  OE <- rep(1e9, length(E)) #initial equity to compare (needs to be high)
  ListEqVal <- append(ListEqVal, list(E)) #record initial equity (with shock)

  iteration <- 0 #set counter
  max_iterations <- 10e9 #if a large network is used (not in the case of the tool)
  while (!all(abs(E - OE) < 1e-6) && iteration < max_iterations) {
    OE <- E
    if (Type == "Distress"){
      OIntVal <- IntVal(L, EL, OE, k, R, a, b)
    }
    else if (Type == "Merton"){
      OIntVal <- Merton(csh, OE, R, EVol, Time)
    }
    else if (Type == "Black"){
      OIntVal <- BlackCox(csh, OE, R, EVol, Time)
      
    }
    else {
      stop("Unknown Type specified.")
    }
    E <- csh - Shock + t(L) %*% matrix(OIntVal) - rowSums(L) - EL #reevaluation of equity
    ListEqVal <- append(ListEqVal, list(E)) #store change in reevaluated equity
    iteration <- iteration + 1 #update counter
  }
  
  if (iteration >= max_iterations) {
    warning("Maximum iterations reached without convergence.") #if max iteration is reached
  }
  
  return(ListEqVal)
}

########################################################################
# Toy Example (Small)
########################################################################
Ae <- matrix(c(20, 10, 10), 3, 1) #external assets 
X <- matrix(c(5, 0, 0), 3, 1) #Shock
MatL <- matrix(c(0, 0, 0,
                 10, 0, 0,
                 0, 10, 0), 3, 3) #liab matrix 
Le <- matrix(c(0, 0, 0), 3, 1) #external liab
E0 <- Ae + rowSums(t(MatL) - MatL) - Le #initial equity
k0 <- E0/(rowSums(MatL) + Le) #capital cushion (distress function)

Results <- NetTool(csh = Ae, Shock = X, L = MatL, EL = Le, 
                   R = 1, k = k0, a = 1, b = 1, 
                   EVol = 0.5, Type = "Distress", Time= 5) #List of reevaluated equity

Results[[1]] - tail(Results,1)[[1]] #calculate equity losses

########################################################################
# Toy Example (Large random network)
########################################################################
#Generation of liabilities matrix 
set.seed(123) #reproducability
n_rows <- 1000 #number of rows 
n_cols <- 1000 #number of columns 
p <- 0.5 #probability entry in the liabilities matrix 
data <- rbinom(n_rows * n_cols, size = 1, prob = p)*runif(n_rows*n_cols, min = 0, max = 10) #generate binary values and assign weights
MatL <- matrix(data, n_rows, n_cols) #restructure into matrix 
diag(MatL) <- 0 #remove diagonals (in line with the model)

print(MatL) #print matrix to console

#Generation of external asset holdings
DeltaLoss <- list()
NDef <- list()
for (i in 1:50){
  Ae <- 260 #Assign external s.t. all firms initially solvent 
  X <- matrix(rep(i, n_rows)) #assign external shock to firms (in this case, all firms are shocked)
  # print X to console
  Le <- 0 #assume no external liabilities for firms 
  E0 <- Ae + rowSums(t(MatL) - MatL) - Le #initial equity
  k0 <- E0/(rowSums(MatL) + Le) #capital cushion (distress function)
  Results <- NetTool(csh = Ae, Shock = X, L = MatL, EL = Le, 
                     R = 1, k = k0, a = 1, b = 1, 
                     EVol = 0.5, Type = "Merton", Time= 5) #List of reevaluated equity
  DeltaLoss[[i]] <- sum(Results[[1]] - tail(Results,1)[[1]]) #calculate equity losses
  NDef[[i]] <- sum(ifelse(tail(Results,1)[[1]]<0,1,0)) #calculate number of firms which default
}

#Plot representing total equity losses from external shock
plot(unlist(DeltaLoss), type = "l", col = "lightblue", lwd = 3,
     xlab = "Shock Size", ylab = "Total Equity Loss", main = "Total Equity Loss vs. Shock Size")

#Plot representing the number of defaults from external shock
plot(unlist(NDef), type = "l", col = "lightcoral", lwd = 3,
     xlab = "Shock Size", ylab = "Number of Defaults", main = "Defaults vs. Shock Size")