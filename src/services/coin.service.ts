import https = require('https');
import Axios = require('axios');
import {Log} from '../utils';
import {AppResponse} from '../commons/app-response.model';

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const CoinServer = process.env.COIN_SERVER || 'http://dev.coinserver.unox.site';

const ApiGetCoinUrl = CoinServer + '/getCoin';
const ApiAddCoinUrl = CoinServer + '/addCoin';
const ApiWithdrawEthUrl = CoinServer + '/withdrawEth';
const ApiGetHistoryUrl = CoinServer + '/getHistory';

const TAG = 'CoinService';

export namespace CoinService {
  export const isAddress = function (address: string) {
    // check if it has the basic requirements of an address
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
        return true;
        // Otherwise check each case
    } else {
        return false;
    }
};
  export const getUserCoin = async function(email: string) {
    try {
      const response = await Axios.default.get(ApiGetCoinUrl, {
        data: {
          email: email,
        },
        responseType: 'json',
        httpsAgent: agent,
      });
      Log.d(TAG, 'getUserCoin response', response.data || 'null');
      return (response.data && response.data.coin) || 0;
    } catch (error) {
      Log.d(TAG, 'getUserCoin', error);
      throw new AppResponse({code: 500, message: 'Get coin failed'});
    }
  };
  export const addUserCoin = async function(email: string, coin: number) {

    try {

      const response = await Axios.default.post(
        ApiAddCoinUrl,
        {
          email: email,
          coin: coin,
        },
        {
          responseType: 'json',
          httpsAgent: agent,
        },
      );

      Log.d(TAG, 'addUserCoin response', response.data || 'null');
      return (response.data && response.data.coin) || 0;
    } catch (error) {
      Log.d(TAG, 'addUserCoin', error);
      throw new AppResponse({code: 500, message: 'Exchange coin failed'});
    }
  };
  export const withdrawEth = async function(email: string, address: string, coin: number) {
    try {
      const response = await Axios.default.post(ApiWithdrawEthUrl, {
        data: {
          email: email,
          address: address,
          coin: coin,
        },
        responseType: 'json',
        httpsAgent: agent,
      });
      Log.d(TAG, 'withdrawEth response', response.data || 'null');
      return response.data || 0;
    } catch (error) {
      Log.d(TAG, 'withdrawEth', error);
      throw new AppResponse({code: 500, message: 'Withdraw Eth failed'});
    }
  };
  export const getHistory = async function(email: string) {
    try {
      const response = await Axios.default.get(ApiGetHistoryUrl, {
        data: {
          email: email,
        },
        responseType: 'json',
        httpsAgent: agent,
      });
      Log.d(TAG, 'getHistory response', response.data || 'null');
      return response.data || 0;
    } catch (error) {
      Log.d(TAG, 'getHistory', error);
      throw new AppResponse({code: 500, message: 'Get history failed'});
    }
  };
}
