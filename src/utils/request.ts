import axios from 'axios';
import {
  generateOauthSignature,
  generateOauthNonce,
  generateAuthorizationHeader,
} from '@utils/helpers';
import { CONSUMER_KEY, CONSUMER_SECRET } from 'react-native-dotenv';
import { WSnackBar } from 'react-native-smart-tip';
import { path } from 'ramda';
import { navigate } from '@utils/navigationService';
import { STATUS_CODE_ENUM, STATUS_CODE_MAP } from '@utils/enum';

const getStatusCode = path<number>(['response', 'status']);

const instance = axios.create({
  baseURL: 'https://api.twitter.com',
});
instance.interceptors.response.use(
  res => res.data,
  err => {
    const statusCode = getStatusCode(err);
    if (statusCode) {
      switch (statusCode) {
        case STATUS_CODE_ENUM.Unauthorized:
          navigate('Auth');
          break;
      }
      // Show snackbar message
      WSnackBar.show({
        position: WSnackBar.position.TOP,
        data: STATUS_CODE_MAP.get(statusCode) || `${statusCode}`,
      });
    }
    return Promise.reject(err);
  }
);

export const getData = <T>(
  oauth: Partial<OAuthToken>,
  url: string,
  extra_params: object = {}
) => {
  const parameters = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: generateOauthNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(new Date().getTime()).substr(0, 10),
    oauth_version: '1.0',
    ...extra_params,
  };
  if (oauth.oauth_token) {
    Object.assign(parameters, {
      oauth_token: oauth.oauth_token,
    });
  }
  const oauthSignature = generateOauthSignature(
    'GET',
    `https://api.twitter.com${url}`,
    parameters,
    CONSUMER_SECRET,
    oauth.oauth_token_secret
  );

  const Authorization = generateAuthorizationHeader({
    ...parameters,
    oauth_signature: oauthSignature,
  });

  return instance.get<T, T>(url, {
    params: extra_params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization,
    },
  });
};

export const postData = <T>(
  oauth: Partial<OAuthToken>,
  url: string,
  extra_params: object = {}
) => {
  const parameters = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: generateOauthNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(new Date().getTime()).substr(0, 10),
    oauth_version: '1.0',
    ...extra_params,
  };
  if (oauth && oauth.oauth_token) {
    Object.assign(parameters, {
      oauth_token: oauth.oauth_token,
    });
  }
  const oauthSignature = generateOauthSignature(
    'POST',
    `https://api.twitter.com${url}`,
    parameters,
    CONSUMER_SECRET,
    oauth ? oauth.oauth_token_secret : ''
  );

  const Authorization = generateAuthorizationHeader({
    ...parameters,
    oauth_signature: oauthSignature,
  });
  const encodeExtraParams = {};
  Object.keys(extra_params).forEach(key => {
    Object.assign(encodeExtraParams, {
      [key]: encodeURIComponent(extra_params[key]),
    });
  });

  return instance.post<T, T>(url, encodeExtraParams, {
    headers: {
      'Content-Type': 'application/json',
      Authorization,
    },
  });
};

export default instance;
