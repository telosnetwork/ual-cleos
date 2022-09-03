import {
    Authenticator,
    Chain,
    UALError,
    UALErrorType,
    User,
} from 'universal-authenticator-library';
import { JsonRpc } from 'eosjs';
import CleosUser from './CleosUser';

const Logo = "data:image/svg+xml,%3C%3Fxml version='1.0' %3F%3E%3Csvg height='24' version='1.1' width='24' xmlns='http://www.w3.org/2000/svg' xmlns:cc='http://creativecommons.org/ns%23' xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23'%3E%3Cg transform='translate(0 -1028.4)'%3E%3Cpath d='m3 1030.4c-1.1046 0-2 0.9-2 2v7 2 7c0 1.1 0.8954 2 2 2h9 9c1.105 0 2-0.9 2-2v-7-2-7c0-1.1-0.895-2-2-2h-9-9z' fill='%232c3e50'/%3E%3Cpath d='m3 1049.4c-1.1046 0-2-0.9-2-2v-7-2-3h22v3 2 7c0 1.1-0.895 2-2 2h-9-9z' fill='%2334495e'/%3E%3Cpath d='m4 1032.9v1.1l2 2.4-2 2.3v1.1l3-3.4-3-3.5z' fill='%23ecf0f1'/%3E%3Cpath d='m3 2c-1.1046 0-2 0.8954-2 2v7 2 3h22v-3-2-7c0-1.1046-0.895-2-2-2h-9-9z' fill='%2334495e' transform='translate(0 1028.4)'/%3E%3Cpath d='m4 5.125v1.125l3 1.75-3 1.75v1.125l5-2.875-5-2.875zm5 4.875v1h5v-1h-5z' fill='%23ecf0f1' transform='translate(0 1028.4)'/%3E%3C/g%3E%3C/svg%3E";

export interface CleosOptions {
    appName: string;
    loginHandler: Function;
    signHandler: Function;
    rpc?: JsonRpc;
}

export class CleosAuthenticator extends Authenticator {
    private chainId: string;
    private rpc: JsonRpc;
    private loginHandler: Function;
    private signHandler: Function;
    constructor(chains: Chain[], options: CleosOptions) {
        super(chains, options);
        this.chainId = chains[0].chainId;
        const [chain] = chains;
        const [rpc] = chain.rpcEndpoints;
        this.loginHandler = options.loginHandler;
        this.signHandler = options.signHandler;

        if (options && options.rpc) {
            this.rpc = options.rpc;
        } else {
            this.rpc = new JsonRpc(`${rpc.protocol}://${rpc.host}:${rpc.port}`);
        }
        this.chains = chains;

    }

    async init() {
        //this.users = await this.login();
    }

    /**
   * Resets the authenticator to its initial, default state then calls init method
   */
    reset() {
        this.init();
    }

    /**
   * Returns true if the authenticator has errored while initializing.
   */
    isErrored() {
        return false;
    }

    getName() {
        return 'cleos';
    }

    /**
   * Returns a URL where the user can download and install the underlying authenticator
   * if it is not found by the UAL Authenticator.
   */
    getOnboardingLink() {
        return 'https://developers.eos.io/manuals/eos/latest/cleos/index';
    }

    /**
   * Returns error (if available) if the authenticator has errored while initializing.
   */
    getError(): UALError | null {
        return null;
    }

    /**
   * Returns true if the authenticator is loading while initializing its internal state.
   */
    isLoading() {
        return false;
    }
    /**
   * Returns the style of the Button that will be rendered.
   */

    getStyle() {
        return {
            // An icon displayed to app users when selecting their authentication method
            icon: Logo,
            // Name displayed to app users
            text: 'cleos',
            // Background color displayed to app users who select your authenticator
            background: '#030238',
            // Color of text used on top the `backgound` property above
            textColor: '#FFFFFF',
        };
    }

    /**
   * Returns whether or not the button should render based on the operating environment and other factors.
   * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
   */
    shouldRender() {
        return true;
    }

    /**
   * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
   * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
   * shouldAutoLogin() true.
   */
    shouldAutoLogin() {
        return false;
    }

    /**
   * Returns whether or not the button should show an account name input field.
   * This is for Authenticators that do not have a concept of account names.
   */
    async shouldRequestAccountName() {
        return false;
    }

    /**
   * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
   *
   * @param accountName  The account name of the user for Authenticators that do not store accounts (optional)
   */
    login: () => Promise<[User]> = async () => {
        try {
            let accountName;
            let permission;
            let publicKey;

            const nowTimestamp = Math.floor(new Date().getTime() / 1000);
            accountName = window.localStorage.getItem('accountName');
            permission = window.localStorage.getItem('permission');
            publicKey = window.localStorage.getItem('publicKey');
            let expiration = window.localStorage.getItem('expiration');

            const isBeforeExpiration = parseInt(expiration || '0', 10) > nowTimestamp;
            if (!(accountName && permission && publicKey && isBeforeExpiration)) {
                const signinData = await this.loginHandler();
                if (!signinData)
                    throw new Error('Cleos sign-in handler did not return any account info');

                accountName = signinData.accountName;
                permission = signinData.permission;
                publicKey = '';
                const expirationNumber: Number = this.shouldInvalidateAfter() + nowTimestamp;
                window.localStorage.setItem('expiration', expirationNumber.toString());
                window.localStorage.setItem('accountName', accountName);
                window.localStorage.setItem('permission', permission);
                window.localStorage.setItem('publicKey', publicKey);
            }

            return [
                new CleosUser({
                    accountName,
                    permission,
                    publicKey,
                    chainId: this.chainId,
                    rpc: this.rpc,
                    loginHandler: this.loginHandler,
                    signHandler: this.signHandler,
                }),
            ];
        } catch (err: any) {
            throw new UALError(err.messsage, UALErrorType.Login, err, 'CleosAuthenticator');
        }
    };

    /**
   * Logs the user out of the dapp. This will be strongly dependent on each
   * Authenticator app's patterns.
   */
    logout = async (): Promise<void> => {
        window.localStorage.removeItem('accountName');
        window.localStorage.removeItem('permission');
        window.localStorage.removeItem('publicKey');
        window.localStorage.removeItem('expiration');
        return;
    };

    /**
   * Returns true if user confirmation is required for `getKeys`
   */
    requiresGetKeyConfirmation() {
        return false;
    }
}

export default CleosAuthenticator;
