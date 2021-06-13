const web3 = new Web3(window.ethereum);
// Contracts variables
let wwt;
let wwtBar;
let tokenPair;
// Contracts Addresses
let wwtAddress = "0x05FFcc649ae21EaE089C860f09240000afE4867D";
let wwtBarAddress = "0x2128Abae635eDD0CA5E34fD22866535Cb27EfeA9";
let tokenPairAddress = "0xA3582b8Ae05218F4e2bD89683472d9426618d227";
// Network ID
let chainID;
// User variables
let accounts;
let user;
let userxWWTBalance;
let userWWTBalance;
//UI Variables
let isStakeUI = true;
let amountToStake;
//Contract Data Variables
let xWWTTotalSupply;
let WWTBalanceOfBar;
let WWTxWWTPair;
//Allowance variables
let userAllowance;
let maxAllowance = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
let loggedIn;
$(document).ready(async () => {
  $("#btnDisconnectWallet").hide();
  $("#btnStakeAmount").hide();
  $("#btnUnstakeAmount").hide();
  $("#btnApproveAmount").hide();
  $("#btnConnectWalletStaking").show();
  if (!window.ethereum) {
    alert("Please consider installing MetaMask to use this DApp!");
  }

  //Check for ChainID
  $("#warningChainId").hide();
  chainID = await web3.eth.net.getId();
  if (chainID === 3) {
    $("#warningChainId").hide();
  } else {
    $("#warningChainId").show();
  }

  init();
  loadStakingData();
  toggleStakeUI();

  //Listen for Chain change
  ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  //Button Listeners
  $("#btnConnectWallet").click(async (e) => {
    e.preventDefault();
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });
    init();
    loadContractData();
    $("#btnConnectWallet").html(accounts[0]);
    $("#btnDisconnectWallet").show();
    $("#btnStakeAmount").show();
    $("#btnUnstakeAmount").show();
    $("#btnApproveAmount").show();
    $("#btnConnectWalletStaking").hide();
    $("#btnConnectWalletUnstaking").hide();
    if (userAllowance === maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").hide();
      $("#btnStakeAmount").show();
    } else if (userAllowance <= maxAllowance && userAllowance >= "0") {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").show();
    } else {
      $("#btnApproveAmount").show();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").hide();
    }
  });

  $("#btnConnectWalletStaking").click(async (e) => {
    e.preventDefault();
    // await window.ethereum.enable();
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });
    init();
    loadContractData();
    $("#btnConnectWallet").html(accounts[0]);
    $("#btnDisconnectWallet").show();
    $("#btnStakeAmount").show();
    $("#btnUnstakeAmount").show();
    $("#btnApproveAmount").show();
    $("#btnConnectWalletStaking").hide();
    $("#btnConnectWalletUnstaking").hide();
    if (userAllowance === maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").hide();
      $("#btnStakeAmount").show();
    } else if (userAllowance <= maxAllowance && userAllowance >= "0") {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").show();
    } else {
      $("#btnApproveAmount").show();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").hide();
    }
  });

  $("#btnConnectWalletUnstaking").click(async (e) => {
    e.preventDefault();
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });
    init();
    loadContractData();
    $("#btnConnectWallet").html(accounts[0]);
    $("#btnDisconnectWallet").show();
    $("#btnStakeAmount").show();
    $("#btnUnstakeAmount").show();
    $("#btnApproveAmount").show();
    $("#btnConnectWalletStaking").hide();
    $("#btnConnectWalletUnstaking").hide();
  });

  $("#btnDisconnectWallet").click(async (e) => {
    e.preventDefault();
    $("#btnConnectWallet").html("Connect");
    $("#btnDisconnectWallet").hide();
    location.reload();
  });

  $("#amountToStake").on("input", async () => {
    let allowance = await wwt.methods.allowance(user, wwtBarAddress).call();
    let amount = web3.utils.toWei($("#amountToStake").val(), "ether");
    allowance = allowance.toString();
    amount = amount.toString();
    if (allowance === maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").hide();
      $("#btnStakeAmount").show();
    }
    if (allowance <= amount) {
      $("#btnApproveAmount").show();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").hide();
    }
    if (amount <= allowance && allowance <= maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").show();
    }
  });

  $("#btnStake").click((e) => {
    e.preventDefault();
    isStakeUI = true;
    toggleStakeUI();
  });

  $("#btnUnstake").click((e) => {
    e.preventDefault();
    isStakeUI = false;
    toggleStakeUI();
  });

  $("#btnApproveAmount").click(async (e) => {
    e.preventDefault();
    amountToStake = $("#amountToStake").val();
    if (amountToStake <= 0 || undefined) {
      alert("Please insert valid amount");
    } else {
      amountToStake = web3.utils.toWei(amountToStake, "ether");
    }

    if (amountToStake <= 0) {
      alert("Please enter a valid amount");
    } else {
      $("#btnApproveAmount").prop("disabled", true);
      await wwt.methods
        .approve(wwtBarAddress, amountToStake)
        .send({ from: user })
        .on("receipt", (receipt) => {
          $("#btnApproveAmount").hide();
          $("#btnStakeAmount").show();
          $("#btnApproveAmount").prop("disabled", false);
          $("#amountToStake").val(0.0);
        })
        .on("error", (error) => {
          alert(error.message);
          $("#btnApproveAmount").prop("disabled", false);
          $("#amountToStake").val(0.0);
        });
    }
  });

  $("#btnApproveMax").click(async (e) => {
    e.preventDefault();
    await wwt.methods
      .approve(wwtBarAddress, maxAllowance)
      .send({ from: user })
      .on("confirmation", (confirmationNumber, receipt) => {
        $("#btnApproveAmount").hide();
        $("#btnStakeAmount").show();
      })
      .on("error", (error) => {
        alert(error.message);
      });
  });

  $("#btnStakeAmount").click(async (e) => {
    e.preventDefault();
    amountToStake = $("#amountToStake").val();
    if (amountToStake <= 0) {
      alert("Please enter a valid amount");
    } else {
      amountToStake = web3.utils.toWei(amountToStake, "ether");
      $("#btnStakeAmount").prop("disabled", true);
      $("#btnUnstakeAmount").prop("disabled", true);
      await wwtBar.methods
        .enter(amountToStake)
        .send({ from: user })
        .on("receipt", () => {
          $("#btnStakeAmount").prop("disabled", false);
          $("#btnUnstakeAmount").prop("disabled", false);
          $("#amountToStake").val(0.0);
          loadContractData();
          //   $("#btnStakeAmount").hide();
          //   $("#btnApproveAmount").show();
        })
        .on("error", (error) => {
          alert(error.message);
          $("#btnStakeAmount").prop("disabled", false);
          $("#btnUnstakeAmount").prop("disabled", false);
          $("#amountToStake").val(0.0);
        });
    }
  });

  $("#btnUnstakeAmount").click(async (e) => {
    e.preventDefault();
    var amountToUnstake = $("#amountToUnstake").val();
    amountToUnstake = web3.utils.toWei(amountToUnstake, "ether");
    if (amountToUnstake <= 0) {
      alert("Please enter a valid amount");
    } else {
      try {
        $("#btnStakeAmount").prop("disabled", true);
        $("#btnUnstakeAmount").prop("disabled", true);
        await wwtBar.methods
          .leave(amountToUnstake)
          .send({ from: user })
          .on("receipt", () => {
            $("#btnStakeAmount").prop("disabled", false);
            $("#btnUnstakeAmount").prop("disabled", false);
            $("#amountToUnstake").val(0.0);
            loadContractData();
          });
      } catch (error) {
        alert(error.message);
        $("#btnStakeAmount").prop("disabled", false);
        $("#btnUnstakeAmount").prop("disabled", false);
        $("#amountToUnstake").val(0.0);
      }
    }
  });

  $("#btnAddTokenToWallet").click(async (event) => {
    event.preventDefault();
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: wwtAddress,
          symbol: "WWT",
          decimals: 18,
          image: "https://foo.io/token-image.svg",
        },
      },
    });
  });

  $("#btnAddxTokenToWallet").click(async (event) => {
    event.preventDefault();
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: wwtBarAddress,
          symbol: "xWWT",
          decimals: 18,
          image: "https://foo.io/token-image.svg",
        },
      },
    });
  });

  $("#btnStakeMax").click(async (event) => {
    event.preventDefault();
    let allowance = await wwt.methods.allowance(user, wwtBarAddress).call();
    let maxAmount = await wwt.methods.balanceOf(user).call();
    maxAmount = web3.utils.fromWei(maxAmount, "ether");
    $("#amountToStake").val(maxAmount);
    allowance = allowance.toString();
    maxAmount = maxAmount.toString();
    if (allowance === maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").hide();
      $("#btnStakeAmount").show();
    }
    if (allowance <= maxAmount) {
      $("#btnApproveAmount").show();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").hide();
    }
    if (maxAmount <= allowance && allowance <= maxAllowance) {
      $("#btnApproveAmount").hide();
      // $("#btnApproveMax").show();
      $("#btnStakeAmount").show();
    }
  });

  $("#btnUnstakeMax").click(async (event) => {
    event.preventDefault();
    let maxAmount = await wwtBar.methods.balanceOf(user).call();
    maxAmount = web3.utils.fromWei(maxAmount, "ether");
    $("#amountToUnstake").val(maxAmount);
  });
});

//Initializing...
async function init() {
  //getting contract Instances
  wwt = new web3.eth.Contract(tokenAbi, wwtAddress);
  wwtBar = new web3.eth.Contract(tokenBarAbi, wwtBarAddress);
  tokenPair = new web3.eth.Contract(abiTokenPair, tokenPairAddress);
  //Fetching Accounts
  accounts = await ethereum.request({ method: "eth_accounts" });
  user = accounts[0];
  //Fetching User Allowance
  userAllowance = await wwt.methods.allowance(user, wwtBarAddress).call();
  maxAllowance =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  //Fetch token Price through token Pair contract
  fetchPrice();
}

//Load Staking Data ()
const loadStakingData = async () => {
  xWWTTotalSupply = await wwtBar.methods.totalSupply().call();
  WWTBalanceOfBar = await wwt.methods.balanceOf(wwtBarAddress).call();
  WWTxWWTPair = WWTBalanceOfBar / xWWTTotalSupply;
  $("#Pair").text(`1xWWT = ${WWTxWWTPair.toFixed(3)} WWT`);
  // $("#Pair2").text(`1xWWT = ${WWTxWWTPair.toFixed(3)} WWT`);
};

//Load Contract Data ()
const loadContractData = async () => {
  userxWWTBalance = await wwtBar.methods.balanceOf(user).call();
  userxWWTBalance = parseFloat(web3.utils.fromWei(userxWWTBalance, "ether"));

  userWWTBalance = await wwt.methods.balanceOf(user).call();
  userWWTBalance = parseFloat(web3.utils.fromWei(userWWTBalance, "ether"));

  $("#xWWTBalance").text(userxWWTBalance.toFixed(3));
  $("#WWTBalance").text(userWWTBalance.toFixed(3));
};

//Fetch TokenPair price
const fetchPrice = async () => {
  let getReserves = await tokenPair.methods.getReserves().call();
  let val0 = getReserves[0];
  let val1 = getReserves[1]; //wETH
  let price = val1 / val0;
  price = Math.floor(price).toFixed(2);
  $("#wwtPrice").text(
    "1 WWT = " +
      web3.utils.fromWei(parseInt(price).toString(), "ether") +
      " wETH"
  );
};

//UI Toggler
const toggleStakeUI = () => {
  if (isStakeUI === true) {
    $("#stakeUI").show();
    $("#unstakeUI").hide();
  } else if (isStakeUI === false) {
    $("#stakeUI").hide();
    $("#unstakeUI").show();
  }
};
