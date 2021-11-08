import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import kp from './keypair.json'


// Constants
const TWITTER_HANDLE = 'MichaelMendez23';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS= [
  'https://media.giphy.com/media/9GIFjYyXor92HZ13pK/giphy.gif',
  'https://media.giphy.com/media/3o7TKpkZRUTt5wuwuc/giphy.gif',
  'https://media.giphy.com/media/3o6Yg9FY49Da9Ebo6A/giphy.gif',
  'https://media.giphy.com/media/WMU80APdGYZG/giphy.gif',
  'https://media.giphy.com/media/5lAAuKSSGPTXi/giphy.gif'
];
// SystemProgram is a reference to the Solana runtime
const { SystemProgram, Keypair } = web3;
// Ensure all users use the key pair we generated(keypair.json)
// with createKeyPair.js
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);
// Set our network to devent.
const network = clusterApiUrl('devnet');
// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}



const App = () => {
  // Declare state variables for determining when to render
  const [walletAddress, setWalletAddress] = useState(null);
  // State variables for submitting new GIFS
  const [inputValue, setInputValue] = useState('');
  //State variable for GIF List
  const [gifList, setGifList] = useState([]);

  //Check for a Phantom Wallet
  const checkIfWalletIsConnected = async () => {
    try {
      //Check the DOM if solana obj has been injected
      const { solana } = window;

      //if found log a message
      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

         //Connect with the wallet if we have already been authorized
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state (declared above checkIfWalletIsConnected)
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  //For the GIF submit button 
  const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!")
    return
  }
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
      },
    });
    console.log("GIF sucesfully sent to program", inputValue)

    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error)
  }
};

  //GIF Submit Button Event
  //Update the state variable
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  //Get provider( authenticated connection to Solana )
  const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection, window.solana, opts.preflightCommitment,
  );
	return provider;
}
//Calls the startStuffOff from our Solana Program
// and creates are account
const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}


  //Render the Connect Wallet button if User has never
  // signed in
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  //Show the GIFs once user has connected and authorized,
  // or show the create account button
  const renderConnectedContainer = () => {
	// If we hit this, it means the program account hasn't be initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    )
  } 
	// Otherwise, we're good! Account exists. User can submit GIFs.
	else {
    return(
      <div className="connected-container">
        <input
          type="text"
          placeholder="Enter gif link!"
          value={inputValue}
          onChange={onInputChange}
        />
        <button className="cta-button submit-gif-button" onClick={sendGif}>
          Submit
        </button>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}





  /*
   * When our component first mounts, let's check to see if we have a connected. We wait until the window is finished loading.
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  //Gets the GIF list
  const getGifList = async() => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    
    console.log("Got the account", account)
    setGifList(account.gifList)

  } catch (error) {
    console.log("Error in getGifs: ", error)
    setGifList(null);
  }
}

  //populating the GIFs
useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList()
  }
}, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
      
        <div className="header-container">
          <p className="header"> Solana Basset Hounds </p>
          <p className="sub-text">
            ✨ View some awesome GIFS of Basset Hounds, and also contribute
            by connecting your Phantom Wallet on Devnet ✨
          </p>
          {/*Render dependet on state*/}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
