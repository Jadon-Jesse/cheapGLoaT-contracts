const fs = require('fs-extra');
const path = require('path');
const assert = require("assert");
const ganache = require("ganache-cli");
// web3 constructor
const Web3 = require("web3");
// web3 instance

var accs = []
var initBalinWei = 100000000000000000000;
// console.log(initBal.toString(16));

for (var i = 0; i < 80; i++) {
  // var hexBal = initBal.toString(16);
  var d = {
    balance: initBalinWei
  };
  accs.push(d);
}
const provider = ganache.provider({ accounts: accs });
const web3 = new Web3(provider);

const contractObj = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../build/CheapGloat.json"), "utf8"));
// console.log(contractObj["CheapGloat"].abi);

let accounts;
let cheapGloat;

beforeEach(async () => {
  // get list of accounuts
  accounts = await web3.eth.getAccounts();
  console.log(accounts);

  // use account to create contract
  cheapGloat = await new web3.eth.Contract(contractObj["CheapGloat"].abi)
    .deploy({
      data: contractObj["CheapGloat"].evm.bytecode.object,
      arguments: []
    })
    .send({
      from: accounts[0],
      gas: "5000000"
    });


});

describe("69_CheapGloat", () => {
  it("Deployes a contract", () => {
    console.log(accounts);
    assert.ok(cheapGloat.options.address);
  });

});