# Cube Integration Test

cube integration test by using Hardhat

You need to run a private chain first. The chain needs to have a admin account, which has a lot of CUBE balance 
and set to `config.chaos.adminDevnet` in genesis 

## Install deps

### software
 - nodejs-16.x.x 
 - yarn

### nodejs module
```
yarn install
```

## Edit environment file

edit `.env` file, set the following environment variables:

```
CUBE_LOCAL_URL=    # private chain RPC
ADMIN_PRIVATE_KEY= # admin account private key with lots of CUBE
ADMIN_ADDR=        # admin account address mentioned above, also set to `config.chaos.adminDevnet` in genesis
```

## Run
```
./run_test.sh
```
