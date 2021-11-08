//This stops a new key pair being generated, and thus
// a new account, everytime the page is refreshed/visited
//by creating one keypair all users share

const fs = require('fs')
const anchor = require("@project-serum/anchor")

const account = anchor.web3.Keypair.generate()

fs.writeFileSync('./keypair.json', JSON.stringify(account))