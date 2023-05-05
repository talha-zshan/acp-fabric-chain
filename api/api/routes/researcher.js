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


router.get('/api/ResarcherReadData', async function(req, res) {
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



// Helper Functions
async function registerResearcher(userID){
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

async function createGateWayOrg2(userId){
    const ccpOrg2 = buildCCPOrg2();
    const walletPathOrg2 = path.resolve(__dirname, '..', '..', '..' ,'asset-transfer-private-data', 'application-javascript', 'wallet', 'org2')
    const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayOrg2 = new Gateway();
        // Connect using Discovery enabled
        await gatewayOrg2.connect(ccpOrg2,
            { wallet: walletOrg2, identity: userId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayOrg1;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

router.post('/api/BuyerAgreeToTransfer', async function(req, res) {
    try {

        const gatewayOrg2 = await createGateWayOrg2(req.body.userId)
        const networkOrg2 = await gatewayOrg2.getNetwork(myChannel);
        const contractOrg2 = networkOrg2.getContract(myChaincodeName);
        let result;
        let dataForAgreement = { assetID: req.body.assetID, appraisedValue: req.body.appraisedValue };
        
        console.log('\n--> Submit Transaction: AgreeToTransfer payload ' + JSON.stringify(dataForAgreement));
        try{
            let statefulTxn = contractOrg2.createTransaction('AgreeToTransfer');
            let tmapData = Buffer.from(JSON.stringify(dataForAgreement));
            statefulTxn.setTransient({
                asset_value: tmapData
            });
            result = await statefulTxn.submit();
        } finally{
            gatewayOrg2.disconnect()
            res.status(200).send(JSON.parse(result))
        }
    } 
    catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).send('Error');
    }    
})

module.exports = router;