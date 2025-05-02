import { Web3 } from "web3";

const web3 = new Web3("https://ethereum-sepolia-rpc.publicnode.com");

const USDT_CONTRACT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";

const TRANSFER_EVENT_SIGNATURE =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const latestBlockNumber = await fetch(
  "https://ethereum-sepolia-rpc.publicnode.com",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    }),
  }
).then((res) => res.json());

const customBlock = web3.utils.toHex(
  web3.utils.toDecimal(latestBlockNumber.result) - 100
);

const logs = await fetch("https://ethereum-sepolia-rpc.publicnode.com", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getLogs",
    params: [
      {
        fromBlock: customBlock,
        toBlock: "latest",
        address: USDT_CONTRACT_ADDRESS,
        topics: [TRANSFER_EVENT_SIGNATURE],
      },
    ],
    id: 1,
  }),
}).then((res) => res.json());

console.log(logs);
