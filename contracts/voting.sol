// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Voting {
    event VoterCreated(
        uint indexed id,
        string name,
        string image,
        address indexed voterAddress,
        bool allowed,
        bool voted,
        uint vote,
        string ipfs
    );

    event CandidateCreated(
        uint indexed id,
        string age,
        string name,
        string image,
        uint voteCount,
        address indexed candidateAddress,
        string ipfs
    );

    address public votingOrganizer;

    struct Candidate {
        uint id;
        string age;
        string name;
        string image;
        uint voteCount;
        address _address;
        string ipfs;
    }

    struct Voter {
        uint _id;
        string names; // name
        string image;
        address _address;
        uint allowed; // 1 if allowed, 0 otherwise
        bool voted;
        uint vote; // index of candidate voted for
        string ipfs;
    }

    // Mappings
    mapping(address => Candidate) public candidates;
    mapping(address => Voter) public voters;

    // Arrays to store addresses for fetching lists
    address[] public candidateAddress;
    address[] public votersAddress;
    address[] public votedVoters;

    constructor() {
        votingOrganizer = msg.sender;
    }

    function setCandidate(
        address _address,
        string memory _age,
        string memory _name,
        string memory _image,
        string memory _ipfs
    ) public {
        // require(votingOrganizer == msg.sender, "Only organizer can register candidates");
        require(candidates[_address].id == 0, "Candidate already exists");

        uint _id = candidateAddress.length;
        
        candidates[_address] = Candidate({
            id: _id,
            age: _age,
            name: _name,
            image: _image,
            voteCount: 0,
            _address: _address,
            ipfs: _ipfs
        });

        candidateAddress.push(_address);

        emit CandidateCreated(
            _id,
            _age,
            _name,
            _image,
            0,
            _address,
            _ipfs
        );
    }

    function getCandidate() public view returns (address[] memory) {
        return candidateAddress;
    }

    function getCandidateLength() public view returns (uint) {
        return candidateAddress.length;
    }

    function getCandidateData(address _address) 
        public 
        view 
        returns (
            string memory, 
            string memory, 
            uint, 
            string memory, 
            uint, 
            string memory, 
            address
        ) 
    {
        return (
            candidates[_address].age,
            candidates[_address].name,
            candidates[_address].id,
            candidates[_address].image,
            candidates[_address].voteCount,
            candidates[_address].ipfs,
            candidates[_address]._address
        );
    }

    // Voter Section
    function voterRight(
        address _address,
        string memory _name,
        string memory _image,
        string memory _ipfs
    ) public {
        // require(votingOrganizer == msg.sender, "Only organizer can register voters");
        require(voters[_address]._address == address(0), "Voter already registered");

        uint _id = votersAddress.length;

        voters[_address] = Voter({
            _id: _id,
            names: _name,
            image: _image,
            _address: _address,
            allowed: 1,
            voted: false,
            vote: 1000, // Default unlikely index
            ipfs: _ipfs
        });

        votersAddress.push(_address);
        
        emit VoterCreated(
            _id,
            _name,
            _image,
            _address,
            true,
            false,
            1000,
            _ipfs
        );
    }

    function vote(address _candidateAddress, uint _candidateId) external {
        Voter storage voter = voters[msg.sender];
        
        require(voter.allowed != 0, "You have no right to vote");
        require(!voter.voted, "You have already voted");

        voter.voted = true;
        voter.vote = _candidateId;

        votedVoters.push(msg.sender);

        candidates[_candidateAddress].voteCount += 1;
    }

    function getVoterLength() public view returns (uint) {
        return votersAddress.length;
    }

    function getVoterData(address _address) 
        public 
        view 
        returns (
            uint, 
            string memory, 
            string memory, 
            address, 
            string memory, 
            uint, 
            bool
        ) 
    {
        return (
            voters[_address]._id,
            voters[_address].names,
            voters[_address].image,
            voters[_address]._address,
            voters[_address].ipfs,
            voters[_address].allowed,
            voters[_address].voted
        );
    }

    function getVotedVoterList() public view returns (address[] memory) {
        return votedVoters;
    }

    function getVoterList() public view returns (address[] memory) {
        return votersAddress;
    }
}