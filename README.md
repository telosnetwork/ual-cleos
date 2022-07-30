# UAL Cleos

## Basic Setup
```bash
~ yarn
~ yarn build
```

## Special handling in frontend
Provide a login handler and sign handler function which will render dialogs for the user.

### `loginHandler`
Returns an object with to properties `accountName` and `permission`

### `signHandler`
Is passed the transaction to sign

## Example

```typescript
  function loginHandler() {
    // TODO: dialog prompt for what account they want to login with
    return {
      accountName: 'eosio',
      permission: 'active'
    };
  }

  function signHandler(trx: any) {
    // TODO: dialog prompt with cleos command for this transaction
    const trxJSON: string = JSON.stringify(
      Object.assign(
        {
          delay_sec: 0,
          max_cpu_usage_ms: 0
        },
        trx
      ),
      null,
      4
    );

    alert(
      `cleos -u https://${process.env.NETWORK_HOST} push transaction '${trxJSON}'`
    );
  }

  const authenticators: Authenticator[] = [
    new Anchor([mainChain], { appName: process.env.APP_NAME }),
    new CleosAuthenticator([mainChain], {
      appName: process.env.APP_NAME,
      loginHandler,
      signHandler
    })
  ];
```