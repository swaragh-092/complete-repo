// const { KEYCLOAK_URL, KEYCLOAK_REALM, CLIENTS}  = require('./index');

// function getClientOIDCConfig(clientKey){
//     const client = CLIENTS[clientKey];
//     if(!client){
//        throw new Error(`Client not registered: ${clientKey}`)
//     }

//     const baseUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/`


//     return {
//         issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
//         authorizationURL: baseUrl+ "auth",
//         tokenURL: baseUrl + "token",
//         userInfoURL: baseUrl +"userinfo",
//         clientID: client.client_id,
//         clientSecret: client.client_secret,
//            callbackURL: client.callback_url,
//            scope: 'openid profile email'
//     }
// }

// module.exports = getClientOIDCConfig;