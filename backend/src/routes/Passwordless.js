const express = require('express');

function sgfyPhoneNumber(phoneNumber) {
  if (phoneNumber.startsWith('+') && !phoneNumber.startsWith('+65')) {
    throw new Error('Invalid country code');
  }
  const noSgCode = phoneNumber.replace('+65', '');
  return `+65${noSgCode.replace(/\D/g, '')}`;
}

function PasswordlessRoutes(userService, auth0Service) {
  const router = express.Router();

  router.post('/begin', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
      console.log(await auth0Service.sendSms(sgfyPhoneNumber(phoneNumber)));
    } catch (e) {
      console.error(e);
    }
    return res.redirect('/');
  });

  router.post('/login', async (req, res) => {
    const { phoneNumber: rawPhoneNumber, code } = req.body;
    const phoneNumber = sgfyPhoneNumber(rawPhoneNumber);

    const { id: userId } = req.user;
    if (!phoneNumber || !code) {
      return res.status(400).send();
    }
    try {
      console.log('Received login attempt');
      const token = await auth0Service.signIn(phoneNumber, code);
      console.log('Received a token', token);
      const user = await userService.verifyUserPhoneNumber(userId, phoneNumber);
      if (!user.isPhoneNumberValidated) {
        return res.status(403).json({ message: 'NOT_WHITELISTED' });
      }
      return res.redirect('/');
    } catch (e) {
      console.error(e);
      const { response } = e;
      if (response && response.data && response.data.error) {
        if (response.data.error === 'invalid_grant') {
          res.status(403).send({ message: 'BAD_OTP' });
        }
      }
      return res.status(403).send();
    }
  });

  return router;
}

module.exports = PasswordlessRoutes;