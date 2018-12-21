const {NodeVM} = require('vm2');
const fs = require('../../fs');

const NOT_ALLOWED_ERROR = "Function not allowed";

class RunCode {
  constructor({logger}) {
    this.logger = logger;
    const newGlobal = Object.create(global);
    newGlobal.fs = fs;
    this.context = {fs};// Object.assign({}, {
      // fs, console, exports, require, module, __filename, __dirname, process,
      // setTimeout, setInterval, clearTimeout, clearInterval
    // });
    
    this.setupNodeVm();    
  }

  setupNodeVm(){
    this.vm = new NodeVM({
      sandbox: this.context,
      require: {
        // builtin: [
        //   "console",
        //   "exports",
        //   "module",
        //   "__filename",
        //   "__dirname",
        //   "process",
        //   "setTimeout",
        //   "setInterval",
        //   "clearTimeout",
        //   "clearInterval"
        // ],
        mock: {
          fs:{
            appendFileSync() { return NOT_ALLOWED_ERROR; },
            copy() { return NOT_ALLOWED_ERROR; },
            copyPreserve() { return NOT_ALLOWED_ERROR; },
            copySync() { return NOT_ALLOWED_ERROR; },
            createWriteStream() { return NOT_ALLOWED_ERROR; },
            ensureFileSync() { return NOT_ALLOWED_ERROR; },
            mkdirp() { return NOT_ALLOWED_ERROR; },
            mkdirpSync() { return NOT_ALLOWED_ERROR; },
            move() { return NOT_ALLOWED_ERROR; },
            moveSync() { return NOT_ALLOWED_ERROR; },
            outputFileSync() { return NOT_ALLOWED_ERROR; },
            remove() { return NOT_ALLOWED_ERROR; },
            removeSync() { return NOT_ALLOWED_ERROR; },
            writeFile() { return NOT_ALLOWED_ERROR; },
            writeFileSync() { return NOT_ALLOWED_ERROR; },
            writeJSONSync() { return NOT_ALLOWED_ERROR; },
            writeJson() { return NOT_ALLOWED_ERROR; }
          }
        },
        external: true
      }
    });
  }

  doEval(code, tolerateError = false) {
    try {
      return this.vm.run(code, __filename);
    } catch(e) {
      if (!tolerateError) {
        this.logger.error(e.message);
      }
      return e.message;
    }
  }

  registerVar(varName, code) {
    // TODO: Update all the code being dependent of web3
    // To identify, look at the top of the file for something like:
    // /*global web3*/
    if (varName === 'web3') {
      global.web3 = code;
    }
    //this.context["global"][varName] = code;
    this.context[varName] = code;
    this.setupNodeVm();
  }

  getWeb3Config() {
    const Web3 = require('web3');
    const provider = this.context.web3.currentProvider;
    let providerUrl;
    if(provider instanceof Web3.providers.HttpProvider){
      providerUrl = provider.host;
    } else if (provider instanceof Web3.providers.WebsocketProvider) {
      providerUrl = provider.connection._url;
    }
    return {defaultAccount: this.context.web3.eth.defaultAccount, providerUrl: providerUrl};
  }
}

module.exports = RunCode;
