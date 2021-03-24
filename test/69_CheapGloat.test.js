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
  // console.log(accounts);

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

  // console.log(cheapGloat.constructor._json.deployedBytecode.length);


});

describe("69_CheapGloat", () => {
  it("Deployes a contract", () => {
    // console.log(accounts);
    assert.ok(cheapGloat.options.address);
  });

  it("Allows one account to submit a link", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    const bl = await web3.eth.getBalance(accounts[0]);
    console.log(bl);
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    const subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");
    // console.log(subAt0);
    const blEnd = await web3.eth.getBalance(accounts[0]);
    console.log(blEnd);
    console.log(bl - blEnd);
  });

  it("Allows one account to submit a link Only Once This round", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    const bl = await web3.eth.getBalance(accounts[0]);
    console.log(bl);
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    const subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");
    // console.log(subAt0);
    const blEnd = await web3.eth.getBalance(accounts[0]);
    console.log(blEnd);
    console.log(bl - blEnd);
  });

  it("Allows one account to submit a link Only Once This round", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    const bl = await web3.eth.getBalance(accounts[0]);
    console.log(bl);

    try {
      await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[0],
        gas: "1000000"
      });

      const subLen = await cheapGloat.methods.subCount().call();
      assert.strictEqual(subLen, "1");

      await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[0],
        gas: "1000000"
      });

      assert(false);

    }
    catch (err) {
      assert(err);
    }

  });



  xit("Allows 69 people to submit uniqueLinks for a round", async () => {
    var uniqLinks = [];
    for (var i = 0; i < 10; i++) {
      var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
      var testCap = "solidity compiler package on npm";
      const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[i],
        gas: "1000000"
      });
      uniqLinks.push(testUrl);

    }

    const subLen = await cheapGloat.methods.subCount().call();
    assert.strictEqual(subLen, "10");

    for (var j = 0; j < 10; j++) {

      const subAtj = await cheapGloat.methods.submissions(j).call();

      assert.strictEqual(subAtj.subAddr, accounts[j]);
      assert.strictEqual(subAtj.subUrl, uniqLinks[j]);

    }

  }).timeout(180000);

  xit("Allows ONLY 69 people to submit uniqueLinks for a round", async () => {


    for (var i = 0; i < 70; i++) {
      if (i >= 69) {
        try {
          var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
          var testCap = "solidity compiler package on npm";
          const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
            from: accounts[i],
            gas: "1000000"
          });

          assert(false);
        }
        catch (error) {
          const subLen = await cheapGloat.methods.subCount().call();
          assert.strictEqual(subLen, "69");
          assert(error);
        }
      }
      else {
        var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
        var testCap = "solidity compiler package on npm";
        const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
          from: accounts[i],
          gas: "1000000"
        });
      }

    }

  }).timeout(180000);


  // Test upvote
  it("Allows one account to submit a link and N users to upvote that submission", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    let subAt0;
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");

    // now upvote the submission
    var numUpvotesTest = 77;
    for (var i = 0; i < numUpvotesTest; i++) {
      // upvote the submission numUpvotesTest Times
      const result = await cheapGloat.methods.upvoteSubmissionById(subAt0.subId).send({
        from: accounts[i],
        value: web3.utils.toWei("0.1", "ether")
      });
    }

    subAt0 = await cheapGloat.methods.submissions(0).call();
    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.upvoteCount, numUpvotesTest.toString());
    assert.strictEqual(subAt0.downvoteCount, "0");

  }).timeout(180000);

  it("Allows one account to submit a link and Only N unique users to upvote that submission", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    let subAt0;
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");

    // now upvote the submission
    var numUpvotesTest = 10;
    for (var i = 0; i < numUpvotesTest; i++) {
      // upvote the submission numUpvotesTest Times
      const result = await cheapGloat.methods.upvoteSubmissionById(subAt0.subId).send({
        from: accounts[i],
        value: web3.utils.toWei("0.1", "ether")
      });
    }

    try {
      // now try upvote sub with an account that's already upvoted the sub
      await cheapGloat.methods.upvoteSubmissionById(subAt0.subId).send({
        from: accounts[5],
        value: web3.utils.toWei("0.1", "ether")
      });
      assert(false);
    }
    catch (error) {
      subAt0 = await cheapGloat.methods.submissions(0).call();
      assert.strictEqual(subAt0.subId, "0");
      assert.strictEqual(subAt0.upvoteCount, numUpvotesTest.toString());
      assert.strictEqual(subAt0.downvoteCount, "0");

      assert(error);
    }

  }).timeout(180000);




  // test downvote
  it("Allows one account to submit a link and N users to downvote that submission", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    let subAt0;
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");

    // now upvote the submission
    var numDownvotesTest = 25;
    for (var i = 0; i < numDownvotesTest; i++) {
      // upvote the submission numDownvotesTest Times
      const result = await cheapGloat.methods.downvoteSubmissionById(subAt0.subId).send({
        from: accounts[i],
        value: web3.utils.toWei("0.1", "ether")
      });
    }

    subAt0 = await cheapGloat.methods.submissions(0).call();
    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.downvoteCount, numDownvotesTest.toString());
    assert.strictEqual(subAt0.upvoteCount, "0");

  }).timeout(180000);

  it("Allows one account to submit a link and Only N unique users to downvote that submission", async () => {
    var testUrl = "https://www.npmjs.com/package/solc";
    var testCap = "solidity compiler package on npm";
    let subAt0;
    await cheapGloat.methods.submitLink(testUrl, testCap).send({
      from: accounts[0],
      gas: "1000000"
    });
    subAt0 = await cheapGloat.methods.submissions(0).call();
    const subLen = await cheapGloat.methods.subCount().call();

    assert.strictEqual(subAt0.subId, "0");
    assert.strictEqual(subAt0.subAddr, accounts[0]);
    assert.strictEqual(subAt0.subUrl, testUrl);
    assert.strictEqual(subAt0.subCaption, testCap);
    assert.strictEqual(subAt0.upvoteCount, "0");
    assert.strictEqual(subAt0.downvoteCount, "0");
    assert.strictEqual(subLen, "1");

    // now upvote the submission
    var numDownvotesTest = 25;
    for (var i = 0; i < numDownvotesTest; i++) {
      // upvote the submission numUpvotesTest Times
      const result = await cheapGloat.methods.downvoteSubmissionById(subAt0.subId).send({
        from: accounts[i],
        value: web3.utils.toWei("0.1", "ether")
      });
    }

    try {
      // now try upvote sub with an account that's already upvoted the sub
      await cheapGloat.methods.downvoteSubmissionById(subAt0.subId).send({
        from: accounts[5],
        value: web3.utils.toWei("0.1", "ether")
      });
      assert(false);
    }
    catch (error) {
      subAt0 = await cheapGloat.methods.submissions(0).call();
      assert.strictEqual(subAt0.subId, "0");
      assert.strictEqual(subAt0.downvoteCount, numDownvotesTest.toString());
      assert.strictEqual(subAt0.upvoteCount, "0");

      assert(error);
    }

  }).timeout(180000);


});