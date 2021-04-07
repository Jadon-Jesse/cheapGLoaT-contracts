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

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
    console.log(cheapGloat.options.address);
    assert.ok(cheapGloat.options.address);
  });

  xit("Allows one account to submit a link", async () => {
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

  xit("Allows one account to submit a link Only Once This round", async () => {
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

  xit("Allows one account to submit a link Only Once This round", async () => {
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
    for (var i = 0; i < 69; i++) {
      var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
      var testCap = "solidity compiler package on npm";
      const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[i],
        gas: "1000000"
      });
      uniqLinks.push(testUrl);

    }

    const subLen = await cheapGloat.methods.subCount().call();
    assert.strictEqual(subLen, "69");

    for (var j = 0; j < 69; j++) {

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
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
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
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
      });
    }

    try {
      // now try upvote sub with an account that's already upvoted the sub
      await cheapGloat.methods.upvoteSubmissionById(subAt0.subId).send({
        from: accounts[5],
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
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
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
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
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
      });
    }

    try {
      // now try upvote sub with an account that's already upvoted the sub
      await cheapGloat.methods.downvoteSubmissionById(subAt0.subId).send({
        from: accounts[5],
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
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


  // test pick winner
  it("Allows n unique users to submit a link and N users to upvote or downvote that submission. Then picks a winner and performs transfers", async () => {
    // var uniqLinks = [];
    var winnerSub;
    const nUsers = 15;
    const chosenWinner = randomInteger(1, nUsers) - 1;

    var currentRoundNum;

    console.log("Chosen winner:", chosenWinner);
    for (var i = 0; i < nUsers; i++) {
      var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
      var testCap = "solidity compiler package on npm";
      const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[i],
        gas: "1000000"
      });
      if (i == chosenWinner) {
        winnerSub = {
          saddr: accounts[i],
          sid: i,
          url: testUrl,
          cap: testCap
        };
      }

    }

    const subLen = await cheapGloat.methods.subCount().call();
    assert(subLen, nUsers);

    // check the current round num
    currentRoundNum = await cheapGloat.methods.currentRoundNum().call();
    assert(currentRoundNum, 0);


    // now everyone go upvote the winner
    const numUpvotesWinner = 26;
    for (var j = 0; j < numUpvotesWinner; j++) {
      await cheapGloat.methods.upvoteSubmissionById(chosenWinner).send({
        from: accounts[j],
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
      });

    }

    const callerAccIndx = 79;

    // check current balances before we call pick winner
    const winnerBalBefore = await web3.eth.getBalance(accounts[chosenWinner]);
    const callerBalBefore = await web3.eth.getBalance(accounts[callerAccIndx]);
    const managerBalBefore = await web3.eth.getBalance(accounts[0]);
    const contractBalBefore = await web3.eth.getBalance(cheapGloat.options.address);

    console.log("Before Pick Winner");
    console.log("Winner Balance: ", web3.utils.fromWei(winnerBalBefore));
    console.log("Caller Balance: ", web3.utils.fromWei(callerBalBefore));
    console.log("Manager Balance: ", web3.utils.fromWei(managerBalBefore));
    console.log("Contract Balance: ", web3.utils.fromWei(contractBalBefore));



    // now call pick winner function from account that hasnt submitted
    const winnerFound = await cheapGloat.methods.checkIfNextRoundAndPickWinner().send({
      from: accounts[callerAccIndx],
      gas: "5000000"
    });
    // console.log("Winner Found", winnerFound);
    const winnerBalAfter = await web3.eth.getBalance(accounts[chosenWinner]);
    const callerBalAfter = await web3.eth.getBalance(accounts[callerAccIndx]);
    const managerBalAfter = await web3.eth.getBalance(accounts[0]);
    const contractBalAfter = await web3.eth.getBalance(cheapGloat.options.address);


    console.log("After Pick Winner");
    console.log("Winner Balance: ", web3.utils.fromWei(winnerBalAfter));
    console.log("Caller Balance: ", web3.utils.fromWei(callerBalAfter));
    console.log("Manager Balance: ", web3.utils.fromWei(managerBalAfter));
    console.log("Contract Balance: ", web3.utils.fromWei(contractBalAfter));


    // submissions will now be an empty array!
    // const winnerData = await cheapGloat.methods.submissions(chosenWinner).call();
    // console.log("Winner Data", winnerData);


    // assert(winnerData.subId, chosenWinner);
    // assert(winnerData.upvoteCount, numUpvotesWinner);

    // now check the gloat list
    const gloatAt0 = await cheapGloat.methods.theGloats(0).call();
    console.log("Gloat Data", gloatAt0);

    const gloatLink0 = await cheapGloat.methods.theGloatLinks(winnerSub.url).call();
    console.log("Gloat Link", gloatLink0);

    // check that the currentRound number increased
    currentRoundNum = await cheapGloat.methods.currentRoundNum().call();


    assert(gloatAt0.subAddr, winnerSub.saddr);
    assert(gloatAt0.subUrl, winnerSub.url);
    assert(gloatAt0.subCaption, winnerSub.cap);
    assert(gloatAt0.roundNumber, 0);
    assert(gloatAt0.upvoteCount, numUpvotesWinner);
    assert(gloatAt0.downvoteCount, 0);

    assert(gloatLink0, true);

    assert(currentRoundNum, 1);

  }).timeout(180000);

  it("Allows n unique users to submit a link and N users to downvote that submission. Then picks a winner and performs transfers", async () => {
    // var uniqLinks = [];
    var winnerSub;
    const nUsers = 15;
    const chosenLooser = randomInteger(1, nUsers) - 1;

    var currentRoundNum;

    // console.log("Chosen looser:", chosenLooser);
    for (var i = 0; i < nUsers; i++) {
      var testUrl = "https://www.testurl.com/TestAccount" + i.toString();
      var testCap = "solidity compiler package on npm";
      const done = await cheapGloat.methods.submitLink(testUrl, testCap).send({
        from: accounts[i],
        gas: "1000000"
      });
      if (i == 0) {
        // winner should be the first index
        winnerSub = {
          saddr: accounts[i],
          sid: i,
          url: testUrl,
          cap: testCap
        };
      }

    }

    const subLen = await cheapGloat.methods.subCount().call();
    assert(subLen, nUsers);

    // check the current round num
    currentRoundNum = await cheapGloat.methods.currentRoundNum().call();
    assert(currentRoundNum, 0);


    // now  go downvote the winner
    const numDownvotesWinner = 26;
    for (var j = 0; j < numDownvotesWinner; j++) {
      await cheapGloat.methods.downvoteSubmissionById(chosenLooser).send({
        from: accounts[j],
        value: web3.utils.toWei("0.5", "ether"),
        gas: "1000000"
      });

    }

    const callerAccIndx = 79;

    // check current balances before we call pick winner
    const winnerBalBefore = await web3.eth.getBalance(accounts[0]);
    const looserBalBefore = await web3.eth.getBalance(accounts[chosenLooser]);
    const callerBalBefore = await web3.eth.getBalance(accounts[callerAccIndx]);
    const managerBalBefore = await web3.eth.getBalance(accounts[0]);
    const contractBalBefore = await web3.eth.getBalance(cheapGloat.options.address);

    console.log("Before Pick Winner");
    console.log("Winner Balance: ", web3.utils.fromWei(winnerBalBefore));
    console.log("Looser Balance: ", web3.utils.fromWei(looserBalBefore));
    console.log("Caller Balance: ", web3.utils.fromWei(callerBalBefore));
    console.log("Manager Balance: ", web3.utils.fromWei(managerBalBefore));
    console.log("Contract Balance: ", web3.utils.fromWei(contractBalBefore));



    // now call pick winner function from account that hasnt submitted
    const winnerFound = await cheapGloat.methods.checkIfNextRoundAndPickWinner().send({
      from: accounts[callerAccIndx],
      gas: "5000000"
    });
    // console.log("Winner Found", winnerFound);
    const winnerBalAfter = await web3.eth.getBalance(accounts[0]);
    const looserBalAfter = await web3.eth.getBalance(accounts[chosenLooser]);
    const callerBalAfter = await web3.eth.getBalance(accounts[callerAccIndx]);
    const managerBalAfter = await web3.eth.getBalance(accounts[0]);
    const contractBalAfter = await web3.eth.getBalance(cheapGloat.options.address);


    console.log("After Pick Winner");
    console.log("Winner Balance: ", web3.utils.fromWei(winnerBalAfter));
    console.log("Looser Balance: ", web3.utils.fromWei(looserBalAfter));
    console.log("Caller Balance: ", web3.utils.fromWei(callerBalAfter));
    console.log("Manager Balance: ", web3.utils.fromWei(managerBalAfter));
    console.log("Contract Balance: ", web3.utils.fromWei(contractBalAfter));

    // now check the gloat list
    const gloatAt0 = await cheapGloat.methods.theGloats(0).call();
    console.log("Gloat Data", gloatAt0);

    const gloatLink0 = await cheapGloat.methods.theGloatLinks(winnerSub.url).call();
    console.log("Gloat Link", gloatLink0);

    // check that the currentRound number increased
    currentRoundNum = await cheapGloat.methods.currentRoundNum().call();


    assert(gloatAt0.subAddr, winnerSub.saddr);
    assert(gloatAt0.subUrl, winnerSub.url);
    assert(gloatAt0.subCaption, winnerSub.cap);
    assert(gloatAt0.roundNumber, 0);
    assert(gloatAt0.upvoteCount, 0);
    assert(gloatAt0.downvoteCount, 0);

    assert(gloatLink0, true);

    assert(currentRoundNum, 1);


  }).timeout(180000);



});