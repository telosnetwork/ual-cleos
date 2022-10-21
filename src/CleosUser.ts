import { User } from 'universal-authenticator-library';
import { JsonRpc } from 'eosjs';
import { SignTransactionResponse } from "universal-authenticator-library/dist/interfaces";

class CleosUser extends User {
    private keys: string[];
    private accountName: string;
    private permission: string;
    private chainId: string;
    private signHandler: Function;
    constructor({
        accountName,
        permission,
        publicKey,
        chainId,
        signHandler,
    }: {
        accountName: string,
        permission: string,
        publicKey: string,
        chainId: string,
        rpc: JsonRpc,
        loginHandler: Function,
        signHandler: Function
    }) {
        super();
        this.keys = [publicKey];
        this.accountName = accountName;
        this.permission = permission;
        this.chainId = chainId;
        this.signHandler = signHandler;
    }

    /**
    * @param transaction  The transaction to be signed (a object that matches the RpcAPI structure).
    */
    signTransaction = async (transaction: any): Promise<SignTransactionResponse> => {
        await this.signHandler(transaction);
        return this.returnEosjsTransaction(false, {});
    };

    /**
     * @param publicKey   The public key to use for signing.
     * @param data        The data to be signed.
     * @param helpText    Help text to explain the need for arbitrary data to be signed.
     *
     * @returns           The signature
     */
    signArbitrary = async (): Promise<string> => {
        throw new Error('cleos does not support signing arbitrary data');
    };

    /**
     * @param challenge   Challenge text sent to the authenticator.
     *
     * @returns           Whether the user owns the private keys corresponding with provided public keys.
     */
    async verifyKeyOwnership() {
        return true;
    }

    getAccountName = async (): Promise<string> => this.accountName;

    getAccountPermission = async (): Promise<string> => this.permission;

    getChainId = async (): Promise<string> => this.chainId;

    getKeys = async (): Promise<string[]> => this.keys;
}

export default CleosUser;
