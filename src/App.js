import logo from "./logo.svg";
import "./App.css";
import Web3 from "web3";
import { useState, useEffect } from "react";
import vestingABI from "./vestingabi";

function App() {
  const [appState, setAppState] = useState({
    account: "",
    isWeb3: false,
    vestingContract: "0xbB097A554e290a8A04A33E27ff7dBe1529221286",
    releasableAmount: 0,
  });

  const releaseAmount = async (flag) => {
    console.log("releaseAmount called");
    let contract = new appState.web3.eth.Contract(
      JSON.parse(vestingABI),
      appState.vestingContract
    );

    let index = null;
    if (appState.account === "0x4a3d2B1aD815552198A94471e033AD0acD59Ba5F") {
      index = 4;
    } else if (
      appState.account === "0xb9D4Cc23d544A752eF15c11DD249bcF176edBC5A"
    ) {
      index = 5;
    }

    let indexFromContract = await contract.methods
      .getVestingIdAtIndex(index)
      .call({ from: appState.account })
      .then((res) => {
        console.log("indexFromContract", res);
        return res;
      })
      .catch((err) => {
        console.log("indexFromContract error", err);
      });

    let releasableAmount = await contract.methods
      .computeReleasableAmount(indexFromContract)
      .call({ from: appState.account })
      .then((res) => {
        console.log("releasableAmount", res);
        setAppState((prevState) => {
          return { ...prevState, releasableAmount: res };
        });
        return res;
      })
      .catch((err) => {
        console.log("releasableAmount error", err);
      });

    if (flag) {
      if (releasableAmount === "0") {
        alert("No amount to release");
        return;
      } else {
        await contract.methods
          .release(indexFromContract, releasableAmount)
          .send({ from: appState.account })
          .then(async (res) => {
            console.log("release", res);
            alert("Successfully released Amount");
            await contract.methods
              .computeReleasableAmount(indexFromContract)
              .call({ from: appState.account })
              .then((res) => {
                console.log("releasableAmount", res);
                setAppState((prevState) => {
                  return { ...prevState, releasableAmount: res };
                });
                return res;
              })
              .catch((err) => {
                console.log("releasableAmount error", err);
              });
          })
          .catch((err) => {
            console.log("release error", err);
          });
      }
    }
  };

  const ConnectWallet = () => {
    console.log("Connect Wallet", window.ethereum);
    if (window.ethereum) {
      appState.isWeb3 = true;
      const ethereum = window.ethereum;
      let web3 = new Web3(ethereum);
      ethereum.enable().then((accounts) => {
        let account = accounts[0];
        web3.eth.defaultAccount = account;
        console.log("Dets", account, appState, ethereum.chainId);
        setAppState((prevState) => {
          return {
            ...prevState,
            isWeb3: true,
            account: web3.utils.toChecksumAddress(accounts[0]),
            web3: web3,
          };
        });
        switchNetworkBinance(web3, ethereum);
      });
    }
  };

  const switchNetworkBinance = async (web3, ethereum) => {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x61",
                chainName: "BNB Testnet",
                rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error while adding new chain to MetaMask");
        }
      }
      // handle other "switch" errors
    }
    setAppState((prevState) => {
      return {
        ...prevState,
        wrongChain: false,
        chainId: ethereum.chainId,
      };
    });
  };

  useEffect(() => {
    ConnectWallet();
  }, []);

  return (
    <div className="App min-h-screen min-w-full flex flex-col justify-center items-center gap-4">
      <p>Account: {appState.account}</p>
      <div className="flex flex-col gap-0">
        <p>Amount Available to Claim: {appState.releasableAmount}</p>
        <p>
          <i>
            (Please Click on Calculate Claimable Amount button to fetch latest
            amount)
          </i>
        </p>
      </div>

      <button
        className="btn btn-accent"
        onClick={() => {
          if (appState.isWeb3) {
            if (
              appState.account ===
                "0x4a3d2B1aD815552198A94471e033AD0acD59Ba5F" ||
              appState.account === "0xb9D4Cc23d544A752eF15c11DD249bcF176edBC5A"
            ) {
              releaseAmount(false);
            } else {
              alert("Incorrect Address");
              //releaseAmount(false);
            }
          } else {
            alert("Please Connect Wallet");
          }
        }}
      >
        Calculate Claimable Amount
      </button>

      <button
        className="btn btn-accent"
        onClick={() => {
          if (appState.isWeb3) {
            if (
              appState.account ===
                "0x4a3d2B1aD815552198A94471e033AD0acD59Ba5F" ||
              appState.account === "0xb9D4Cc23d544A752eF15c11DD249bcF176edBC5A"
            ) {
              releaseAmount(true);
            } else {
              alert("Incorrect Address");
              //releaseAmount(true);
            }
          } else {
            alert("Please Connect Wallet");
          }
        }}
      >
        Claim
      </button>
    </div>
  );
}

export default App;
