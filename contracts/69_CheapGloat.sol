// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.8.0;

contract CheapGloat {
    struct Gloat {
        address subAddr;
        string subUrl;
        string subCaption;
        uint256 roundNumber;
        uint256 upvoteCount;
        uint256 downvoteCount;
    }

    struct Submission {
        uint256 subId;
        address subAddr;
        string subUrl;
        string subCaption;
        uint256 roundNumber;
        uint256 upvoteCount;
        mapping(address => bool) upvotes;
        uint256 downvoteCount;
        mapping(address => bool) downvotes;
    }
    address public manager;
    uint256 public roundStartTime;

    uint256 public subCount;
    uint256 public subIndex;

    // keep track of who submitted this round
    // also track the keys
    mapping(address => bool) public roundSubAddrs;
    address[] public roundSubAddrsKeys;

    // keep track of links submitted this round
    mapping(string => bool) public roundSubLinks;
    // also keep track of keys so that we can reset the mapping for next round
    string[] public roundSubLinksKeys;

    // keep track of Gloats
    mapping(string => bool) public theGloatLinks;
    // all gloat objects as hash table + trackingCountVariable
    uint256 gloatIndex;
    mapping(uint256 => Gloat) public theGloats;

    Submission[69] public submissions;
    // mapping (uint => Submission) public bids;

    uint256 public currentRoundNum = 0;

    // uint public roundIntervalSeconds = 21600;
    uint256 public roundIntervalSeconds = 600;
    bool locked = false;

    constructor() {
        manager = msg.sender;
        roundStartTime = block.timestamp;
    }

    function submitLink(string memory url, string memory caption) public {
        require(!locked);
        require(!roundSubAddrs[msg.sender]);
        require(!roundSubLinks[url]);
        require(!theGloatLinks[url]);
        require(subCount <= 69);

        Submission storage newSubmission = submissions[subCount++];
        newSubmission.subId = subIndex;
        newSubmission.subAddr = msg.sender;
        newSubmission.subUrl = url;
        newSubmission.subCaption = caption;
        newSubmission.roundNumber = currentRoundNum;
        newSubmission.upvoteCount = 0;
        newSubmission.downvoteCount = 0;

        // track who and what was submitted this round
        roundSubAddrs[msg.sender] = true;
        roundSubLinks[url] = true;

        roundSubAddrsKeys.push(msg.sender);
        roundSubLinksKeys.push(url);

        subIndex++;
    }

    function getCurrentRoundSubmissions(uint256 subId)
        public
        view
        returns (
            uint256,
            address,
            string memory,
            string memory,
            uint256
        )
    {
        Submission storage submissionAtInd = submissions[subId];

        uint256 sid = submissionAtInd.subId;
        address saddr = submissionAtInd.subAddr;
        string memory surl = submissionAtInd.subUrl;
        string memory scap = submissionAtInd.subCaption;
        uint256 srn = submissionAtInd.roundNumber;

        return (sid, saddr, surl, scap, srn);
    }

    function upvoteSubmissionById(uint256 subId) public payable {
        require(!locked, "picking winner");
        require(msg.value >= 0.1 ether);
        require(subCount > 0);
        require(subId < subCount);

        Submission storage submissionAtId = submissions[subId];
        require(!submissionAtId.upvotes[msg.sender]);

        submissionAtId.upvotes[msg.sender] = true;
        submissionAtId.upvoteCount++;
    }

    function downvoteSubmissionById(uint256 subId) public payable {
        require(!locked, "picking winner");
        require(msg.value >= 0.1 ether);
        require(subCount > 0);
        require(subId < subCount);

        Submission storage submissionAtId = submissions[subId];
        require(!submissionAtId.downvotes[msg.sender]);

        submissionAtId.downvotes[msg.sender] = true;
        submissionAtId.downvoteCount++;
    }

    function checkIfNextRoundAndPickWinner() public returns (bool) {
        require(!locked, "Reentrant detected!");
        uint256 ts = block.timestamp;
        uint256 tdiffSeconds = ts - roundStartTime;

        Submission storage submissionAt0 = submissions[0];

        // init variables for search
        uint256 winnerIndx = 0;
        bool winnerFound = false;
        int256 highScore =
            int256(submissionAt0.upvoteCount) -
                int256(submissionAt0.downvoteCount);

        if (tdiffSeconds > roundIntervalSeconds) {
            locked = true;
            for (uint256 i = 0; i < 69; i++) {
                Submission storage submissionAtIndi = submissions[i];
                int256 subScore =
                    int256(submissionAtIndi.upvoteCount) -
                        int256(submissionAtIndi.downvoteCount);

                if (subScore > highScore) {
                    winnerIndx = i;
                    winnerFound = true;
                }
            }
            // process winner, settle funds, and reset the contract
            Submission storage roundWinner = submissions[winnerIndx];

            // add to the Gloats
            Gloat storage newGloat = theGloats[gloatIndex++];
            newGloat.subAddr = roundWinner.subAddr;
            newGloat.subUrl = roundWinner.subUrl;
            newGloat.subCaption = roundWinner.subCaption;
            newGloat.roundNumber = roundWinner.roundNumber;
            newGloat.upvoteCount = roundWinner.upvoteCount;
            newGloat.downvoteCount = roundWinner.downvoteCount;

            // track gloatLinks
            theGloatLinks[roundWinner.subUrl] = true;

            // now settle payments
            // 1e18 is 1 eth in wei so use 1e17 to get 0.1 eth in wei

            uint256 prize = roundWinner.upvoteCount * 1e17;

            payable(roundWinner.subAddr).transfer(prize);
            payable(manager).transfer(address(this).balance);

            // reset varuables for next round

            // first delete all round linkSubmissions
            for (uint256 j = 0; j < roundSubLinksKeys.length; j++) {
                delete roundSubLinks[roundSubLinksKeys[j]];
            }
            delete roundSubLinksKeys;
            // next delete all round addresses
            for (uint256 k = 0; k < roundSubAddrsKeys.length; k++) {
                delete roundSubAddrs[roundSubAddrsKeys[k]];
            }
            delete roundSubAddrsKeys;

            delete submissions;

            subCount = 0;
            subIndex = 0;
            roundStartTime = block.timestamp;
            currentRoundNum++;

            locked = false;
        }
        return winnerFound;
    }
}
