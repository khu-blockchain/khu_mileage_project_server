const cookie = require('cookie');

const setCookie = (res, name, data, expires = null) => {
   return res.setHeader('Set-Cookie', cookie.serialize(name, data, {
      httpOnly: true,
      maxAge  : 60 * 60 * 1000,
      path    : '/',
      sameSite: 'lax',
      secure  : false,
      // domain  : 'localhost',
      expires : expires ? new Date(expires) : undefined
   }));
}

const deleteCookie = (res, name) => {
   return res.setHeader('Set-Cookie', cookie.serialize(name, '', {
      httpOnly: true,
      maxAge  : 0,
      path    : '/',
      sameSite: 'lax',
      secure  : false,
      // domain  : 'localhost',
   }));
}

module.exports = {
   setCookie,
   deleteCookie
}