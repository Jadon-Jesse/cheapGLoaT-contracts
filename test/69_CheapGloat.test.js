const fs = require('fs-extra');
const path = require('path');
const assert = require("assert");
const ganache = require("ganache-cli");
// web3 constructor
const Web3 = require("web3");
// web3 instance
const provider = ganache.provider();
const web3 = new Web3(provider);
// const { interface, bytecode } = require("../compile");
// const source = fs.readFileSync(inboxPath, "utf8");
const buildPath = path.resolve(__dirname, 'build');

const contractObj = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../build/CheapGloat.json"), "utf8"));
console.log(contractObj["CheapGloat"].abi);
// console.log(typeof contractObj);

let accounts;
let inbox;

const INIT_STR = "Hi there";
beforeEach(async () => {
  // get list of accounuts
  accounts = await web3.eth.getAccounts();

  // use account to create contract
  inbox = await new web3.eth.Contract(contractObj["CheapGloat"].abi)
  .deploy({
    data:contractObj["CheapGloat"].evm.bytecode.object,
    arguments: []
  })
  .send({
    from:accounts[0],
    gas:"5000000"
  });

  inbox.setProvider(provider);

});

describe("69_CheapGloat", () => {
  it("Deployes a contract", () => {
    console.log(accounts);
    assert.ok(inbox.options.address);
  });

});