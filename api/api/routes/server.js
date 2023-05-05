var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
'use strict';

// var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: true });
// app.use(bodyParser.json());

// Setting for Hyperledger Fabric
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../../test-application/javascript/AppUtil.js');
// const {memberAssetCollectionName, org1PrivateCollectionName, org2PrivateCollectionName, mspOrg1, mspOrg2} = require('../constants/collectionConstants');
const memberAssetCollectionName = 'assetCollection';
const org1PrivateCollectionName = 'Org1MSPPrivateCollection';
const org2PrivateCollectionName = 'Org2MSPPrivateCollection';
const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';

const fs = require('fs');
const RED = '\x1b[31m\n';
const GREEN = '\x1b[32m\n';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';


// constants in this application
const myChannel = 'mychannel';
const myChaincodeName = 'private';
const Org1UserId = 'appUser1';
const Org2UserId = 'appUser2';
const walletPathOrg1 = path.join(__dirname, 'wallet/org1');
const walletPathOrg2 = path.join(__dirname, 'wallet/org2');


router.post('/api/regsiterUser', async function(req, res){
    try{
        let userType = req.body.userType
       try{ 
            if (userType.toLowerCase() === 'user') {
                await registerNewUser(req.body.userId)
            } else {
                await registerNewResearcher(req.body.userId)
            }
        }finally{
            res.status(200).send('Success');
        }
    } catch (error) {
        console.error(`Error in registering user`);
        res.status(400).send('Error');
    }
})

router.post('/api/addPrivateData', async function (req, res) {

    try{
        /** ******* Fabric client init: Using Org1 identity to Org1 Peer ********** */
        const gatewayOrg1 = await createGateWayOrg1(req.body.userId)
        const networkOrg1 = await gatewayOrg1.getNetwork(myChannel);
        const contractOrg1 = networkOrg1.getContract(myChaincodeName);
        // Since this sample chaincode uses, Private Data Collection level endorsement policy, addDiscoveryInterest
        // scopes the discovery service further to use the endorsement policies of collections, if any
        contractOrg1.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, org1PrivateCollectionName] });
        try{
            // let assetID = req.body.phrase
            const assetType = 'publicData'
            let result;
            let assetData = {objectType: assetType, assetID: req.body.phrase, provider: req.body.provider, ageRange: req.body.ageRange, data: req.body.data}

            console.log('Adding Assets to work with:\n--> Submit Transaction: CreateAsset ' + req.body.phrase);
            let statefulTxn = contractOrg1.createTransaction('CreatePublicAsset');
            let tmapData = Buffer.from(JSON.stringify(assetData));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();

        } finally {
            gatewayOrg1.disconnect()
            res.status(200).send('Success! Private Data added');
        }
    } catch (error) {
        console.error(`Error in transaction: ${error}`);
        if (error.stack) {
            console.error(error.stack);
        }
        res.status(400).send('Error! Failed to Add Data');
    }

})

router.post('/api/setPrivateDataPrice', async function (req, res) {

    try{
        /** ******* Fabric client init: Using Org1 identity to Org1 Peer ********** */
        const gatewayOrg1 = await createGateWayOrg1(req.body.userId);
        const networkOrg1 = await gatewayOrg1.getNetwork(myChannel);
        const contractOrg1 = networkOrg1.getContract(myChaincodeName);
        // Since this sample chaincode uses, Private Data Collection level endorsement policy, addDiscoveryInterest
        // scopes the discovery service further to use the endorsement policies of collections, if any
        contractOrg1.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, org1PrivateCollectionName] });
        try{
            let assetID = req.body.phrase
            const assetType = 'dataPrice'
            let result;
            let assetData = {objectType: assetType, assetID: assetID, appraisedValue: req.body.appraisedValue}

            console.log('Adding Assets to work with:\n--> Submit Transaction: CreateAsset ' + assetID1);
            let statefulTxn = contractOrg1.createTransaction('setPrivateAssetPrice');
            let tmapData = Buffer.from(JSON.stringify(assetData));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();

        } finally {
            gatewayOrg1.disconnect()
        }
    } catch (error) {
        console.error(`Error in transaction: ${error}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }

})

router.post('/api/regsiterUser', async function(req, res){
    try{
        let userType = req.body.userType
       try{ 
            if (userType.toLowerCase() === 'user') {
                await registerNewUser(req.body.userId)
            } else {
                await registerNewResearcher(req.body.userId)
            }
        }finally{
            res.status(200).send('Success');
        }
    } catch (error) {
        console.error(`Error in registering user`);
        res.status(400).send('Error');
    }
})
// router.post('/api/BuyerAgreeToTransfer', async function(req, res) {
//     try {

//         const gatewayOrg2 = await createGateWayOrg2(req.body.userId)
//         const networkOrg2 = await gatewayOrg2.getNetwork(myChannel);
//         const contractOrg2 = networkOrg2.getContract(myChaincodeName);
//         let result;
//         let dataForAgreement = { assetID: req.body.assetID, appraisedValue: req.body.appraisedValue };
        
//         console.log('\n--> Submit Transaction: AgreeToTransfer payload ' + JSON.stringify(dataForAgreement));
//         try{
//             let statefulTxn = contractOrg2.createTransaction('AgreeToTransfer');
//             let tmapData = Buffer.from(JSON.stringify(dataForAgreement));
//             statefulTxn.setTransient({
//                 asset_value: tmapData
//             });
//             result = await statefulTxn.submit();
//         } finally{
//             gatewayOrg2.disconnect()
//             res.status(200).send(JSON.parse(result))
//         }
//     } 
//     catch (error) {
//         console.error(`Failed to evaluate transaction: ${error}`);
//         res.status(400).send('Error');
//     }    
// })

router.post('/api/BuyerWithdrawTransfer', async function(req, res) {
    try {
        const gatewayOrg2 = await createGateWayOrg2(req.body.userId)
        const networkOrg2 = await gatewayOrg2.getNetwork(myChannel);
        const contractOrg2 = networkOrg2.getContract(myChaincodeName);
        let result;
        let withdrawAgreement = { assetID: req.body.assetID};
        console.log('\n--> Delete Transaction: AgreeToTransfer payload ' + JSON.stringify(dataForAgreement));
        
        try{
            let statefulTxn = contractOrg2.createTransaction('DeleteTransferAgreement');
            tmapData = Buffer.from(JSON.stringify(dataForAgreement));
            statefulTxn.setTransient({
                asset_value: tmapData
            });
            result = await statefulTxn.submit();
        }finally{
            gatewayOrg2.disconnect()
            res.status(200).send('Agreement Withdrawn')
        }
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).send('Failure');
    }    
})

router.get('/api/ReadPrivateData', async function(req, res) {
    try {
        const gatewayOrg1 = await createGateWayOrg1(req.body.userId)
        const networkOrg1 = await gatewayOrg1.getNetwork(myChannel);
        const contractOrg1 = networkOrg1.getContract(myChaincodeName);
        let result;
        
        try{
            result = await contractOrg1.evaluateTransaction('ReadAsset', req.body.assetID)
        }finally{
            gatewayOrg1.disconnect()
            res.status(200).send(result)
        }
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).send('Failure');
    }    
})



/*Admin internal api call for testing*/
router.post('/api/registerAdmins', async function(req, res){
    try{
        // Org1 Admin
        const ccpOrg1 = buildCCPOrg1();
        const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');
        const walletPathOrg1 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org1')
        const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

        // Org1 Admin
        const ccpOrg2 = buildCCPOrg2();
        const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, 'ca.org2.example.com');
        const walletPathOrg2 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org2')
        const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

       try{ 
            await enrollAdmin(caOrg1Client, walletOrg1, mspOrg1)
            await enrollAdmin(caOrg2Client, walletOrg2, mspOrg2)
        }finally{
            res.status(200).send('Success! Administrator registered for org1 and org2');
        }
    } catch (error) {
        console.error(`Error in registering admins`);
        res.status(400).send('Error');
    }
})

router.post('/api/addSalePrivateData', async function (req, res) {

    try{
        /** ******* Fabric client init: Using Org1 identity to Org1 Peer ********** */
        const gatewayOrg1 = await createGateWayOrg1(req.body.userId)
        const networkOrg1 = await gatewayOrg1.getNetwork(myChannel);
        const contractOrg1 = networkOrg1.getContract(myChaincodeName);
        // Since this sample chaincode uses, Private Data Collection level endorsement policy, addDiscoveryInterest
        // scopes the discovery service further to use the endorsement policies of collections, if any
        contractOrg1.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, org1PrivateCollectionName] });
        try{
            // let assetID = req.body.phrase
            const assetType = 'publicData'
            let result;
            let assetData = {objectType: assetType, assetID: req.body.phrase, Color: req.body.provider, appraisedValue: 100, Size: req.body.data}

            console.log('Adding Assets to work with:\n--> Submit Transaction: CreateAsset ' + req.body.phrase);
            let statefulTxn = contractOrg1.createTransaction('CreateAsset');
            let tmapData = Buffer.from(JSON.stringify(assetData));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();

        } finally {
            gatewayOrg1.disconnect()
            res.status(200).send('Success! Private Data added');
        }
    } catch (error) {
        console.error(`Error in transaction: ${error}`);
        if (error.stack) {
            console.error(error.stack);
        }
        res.status(400).send('Error! Failed to Add Data');
    }

})



/** ******* Helper Functions ********** */
function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

function doFail(msgString) {
    console.error(`${RED}\t${msgString}${RESET}`);
    process.exit(1);
}

function verifyAssetData(org, resultBuffer, expectedId, color, size, ownerUserId, appraisedValue) {

    let asset;
    if (resultBuffer) {
        asset = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset');
    }
    console.log(`*** verify asset data for: ${expectedId}`);
    if (!asset) {
        doFail('Received empty asset');
    }
    if (expectedId !== asset.assetID) {
        doFail(`recieved asset ${asset.assetID} , but expected ${expectedId}`);
    }
    if (asset.color !== color) {
        doFail(`asset ${asset.assetID} has color of ${asset.color}, expected value ${color}`);
    }
    if (asset.size !== size) {
        doFail(`Failed size check - asset ${asset.assetID} has size of ${asset.size}, expected value ${size}`);
    }

    if (asset.owner.includes(ownerUserId)) {
        console.log(`\tasset ${asset.assetID} owner: ${asset.owner}`);
    } else {
        doFail(`Failed owner check from ${org} - asset ${asset.assetID} owned by ${asset.owner}, expected userId ${ownerUserId}`);
    }
    if (appraisedValue) {
        if (asset.appraisedValue !== appraisedValue) {
            doFail(`Failed appraised value check from ${org} - asset ${asset.assetID} has appraised value of ${asset.appraisedValue}, expected value ${appraisedValue}`);
        }
    }
}

function verifyAssetPrivateDetails(resultBuffer, expectedId, appraisedValue) {
    let assetPD;
    if (resultBuffer) {
        assetPD = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset private details');
    }
    console.log(`*** verify private details: ${expectedId}`);
    if (!assetPD) {
        doFail('Received empty data');
    }
    if (expectedId !== assetPD.assetID) {
        doFail(`recieved ${assetPD.assetID} , but expected ${expectedId}`);
    }

    if (appraisedValue) {
        if (assetPD.appraisedValue !== appraisedValue) {
            doFail(`Failed appraised value check - asset ${assetPD.assetID} has appraised value of ${assetPD.appraisedValue}, expected value ${appraisedValue}`);
        }
    }
}

async function initContractFromOrg1Identity() {
    console.log('\n--> Fabric client user & Gateway init: Using Org1 identity to Org1 Peer');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccpOrg1 = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

    // setup the wallet to cache the credentials of the application user, on the app server locally
    // const walletPathOrg1 = path.join(__dirname, 'wallet/org1');
    const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

    // in a real application this would be done on an administrative flow, and only once
    // stores admin identity in local wallet, if needed
    await enrollAdmin(caOrg1Client, walletOrg1, mspOrg1);
    // register & enroll application user with CA, which is used as client identify to make chaincode calls
    // and stores app user identity in local wallet
    // In a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(caOrg1Client, walletOrg1, mspOrg1, Org1UserId, 'org1.department1');

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayOrg1 = new Gateway();
        // Connect using Discovery enabled
        await gatewayOrg1.connect(ccpOrg1,
            { wallet: walletOrg1, identity: Org1UserId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayOrg1;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

async function initContractFromOrg2Identity() {
    console.log('\n--> Fabric client user & Gateway init: Using Org2 identity to Org2 Peer');
    const ccpOrg2 = buildCCPOrg2();
    const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, 'ca.org2.example.com');

    const walletPathOrg2 = path.join(__dirname, 'wallet/org2');
    const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

    await enrollAdmin(caOrg2Client, walletOrg2, mspOrg2);
    await registerAndEnrollUser(caOrg2Client, walletOrg2, mspOrg2, Org2UserId, 'org2.department1');

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayOrg2 = new Gateway();
        await gatewayOrg2.connect(ccpOrg2,
            { wallet: walletOrg2, identity: Org2UserId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayOrg2;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

async function registerNewUser(userID){
    console.log('\n--> Fabric client user & Gateway init: Using Org1 identity to Org1 Peer');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccpOrg1 = buildCCPOrg1();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

    // setup the wallet to cache the credentials of the application user, on the app server locally
    const walletPathOrg1 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org1')
    const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

   
    // register & enroll application user with CA, which is used as client identify to make chaincode calls
    // and stores app user identity in local wallet
    // In a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(caOrg1Client, walletOrg1, mspOrg1, userID, 'org1.department1');
}

async function registerNewResearcher(userID){
    console.log('\n--> Fabric client user & Gateway init: Using Org1 identity to Org1 Peer');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccpOrg2 = buildCCPOrg2();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, 'ca.org2.example.com');

    // setup the wallet to cache the credentials of the application user, on the app server locally
    const walletPathOrg2 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org2')
    const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

   
    // register & enroll application user with CA, which is used as client identify to make chaincode calls
    // and stores app user identity in local wallet
    // In a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(caOrg2Client, walletOrg2, mspOrg2, userID, 'org2.department1');
}

async function createGateWayOrg1(userId){
    const ccpOrg1 = buildCCPOrg1();
    const walletPathOrg1 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org1')
    const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayOrg1 = new Gateway();
        // Connect using Discovery enabled
        await gatewayOrg1.connect(ccpOrg1,
            { wallet: walletOrg1, identity: userId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayOrg1;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

module.exports = router