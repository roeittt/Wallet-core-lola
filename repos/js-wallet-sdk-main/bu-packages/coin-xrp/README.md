# @okxweb3/coin-xrp
XRP SDK is used to interact with the xrp blockchain, it contains various functions can be used to web3 wallet.

## Installation

### Npm

To obtain the latest version, simply require the project using npm :

```shell
npm install @okxweb3/coin-xrp
```

## Usage

### Generate Private Key

```typescript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
// get random key
let randomPrivateKey = await wallet.getRandomPrivateKey();

// get derived key
let params = {
    mnemonic: "stool trumpet fame umbrella bench provide battle toward story fruit lock view",
    chainPath: "m/44'/144'/0'/0/1"
}
let derivePrivateKey = await wallet.getDerivedPrivateKey(params);
```

### Private Key Derivation

```typescript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let mnemonic = "stool trumpet fame umbrella bench provide battle toward story fruit lock view"
let param = {
  mnemonic: mnemonic,
  hdPath: "m/44'/144'/0'/0/0"
};

let privateKey = await wallet.getDerivedPrivateKey(param)
```

### Generate Address

```typescript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let params = {
    privateKey: 'EDD2AF6288A903DED9860FC62E778600A985BDF804E40BD8266505553E3222C3DA'
}
let newAddress = await wallet.getNewAddress(params);
```

### Verify Address

```typescript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let params = {
    address: "rQKQsPeE3iTRyfUypLhuq74gZdcRdwWqDp"
};
let valid = await wallet.validAddress(params);
```

### Sending a Transfer Transaction
Use the signTransaction function to get the signed hex to broadcast
#### Example

```javascript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let signParams = {
    privateKey: seed1,
    data: {
        type: "transfer" ,
        base: {
            Account:"rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw",
            Flags: 0,
            Fee:"12",
            Sequence:5779448,
            LastLedgerSequence: 5784941
        },
        data: {
            TransactionType: 'Payment',
            Amount: '1.23',
            Destination: 'rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE',
        }
    }
}
let tx = await wallet.signTransaction(signParams)
```



### trust set
Use the signTransaction function to get the signed hex to broadcast
#### Example

```javascript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let signParams = {
    privateKey: seed1,
    data: {
        type: "TrustSet" ,
        base: {
            Account:"rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw",
            Flags: 0,
            Fee:"12",
            Sequence:5779449,
            LastLedgerSequence: 5785541
        },
        data: {
            Account: 'rnyyyTfmc4MLRXqn7fhJW51fxttPp4djHw',
            LimitAmount: {
                currency: "USD",
                issuer: "rJdzXHR7qcPTqpESwJt5TJDhqaRe8oVAgE",
                value:"123",
            }
        }
    }
}
let tx = await wallet.signTransaction(signParams)
```


### send currency
Use the signTransaction function to get the signed hex to broadcast
#### Example

```javascript
import { XrpWallet } from "@okxweb3/coin-xrp"

let wallet = new XrpWallet();
let signParams = {
    privateKey: seed2,
    data: {
        type: "transfer" ,
        base: {
            Account:address2,
            Flags: 0,
            Fee:"12",
            Sequence:5779442,
            LastLedgerSequence: 5786248
        },
        data: {
            Destination:address1,
            Amount: {
                currency: "USD",
                issuer: address2,
                value:"1.23",
            }
        }
    }
}
let tx = await wallet.signTransaction(signParams)
```

#### Sign Message

```
 const msg = {
            messageId: "123",
            url: "",
            title: "",
            favicon: "",
            message: "",
        }
const sig = await wallet.signMessage({
    privateKey: "003BA2B1DB9231EEEB6F85EEEF0B4F71B493DBDC315E6458480B378D73FAFA1398",
    data: msg,
})
```


## License

[MPL-2.0](<https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2)>)
