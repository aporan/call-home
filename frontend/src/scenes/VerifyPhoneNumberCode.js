import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Container from '../components/shared/Container';
import { useUserService } from '../contexts';
import RoundedButton, {
  PrimaryButton,
} from '../components/shared/RoundedButton';
import { beginPasswordless, login } from '../services/Auth';
import PATHS from './paths';

// TODO figure out where to put these later
const EN_STRINGS = {
  VERIFY_PHONE_NUMBER_VERIFICATION_TITLE:
    'Enter the verification code sent to {phoneNumber}',
  VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE: 'Wrong code',
  VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL: 'Verfication code',
  VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL: 'Resend code',
  VERIFY_PHONE_NUMBER_SUBMIT_LABEL: 'Submit',
  VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE:
    ' Sorry, your phone number is not part of this programme. If you believe this is an error, reach out to an administrator.',
};
const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    VERIFY_PHONE_NUMBER_VERIFICATION_TITLE:
      'আপনার মোবাইল নাম্বারে প্রেরিত কোডটি প্রবেশ করান ({phoneNumber})',
    VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE: 'ভুল কোড',
    VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL: 'যাচাইকরণ কোড', // Google translate
    VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL: 'পুনরায় পাঠানো কোড', // Google translate
    VERIFY_PHONE_NUMBER_SUBMIT_LABEL: 'জমা দিন', // Google translate
    /* VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE:
     *   ' Sorry, your phone number is not part of this programme. If you believe this is an error, reach out to an administrator.', */
  },
};

export default function VerificationPhoneNumberCode({ locale }) {
  const [userState, userService] = useUserService();
  const { me: user } = userState;
  const { verificationPhoneNumber: phoneNumber } = userState;
  const [code, setCode] = useState('');
  const [hasBadOtpError, setHasBadOtpError] = useState(false);
  const [hasAllowlistError, setHasAllowlistError] = useState(false);

  useEffect(() => {
    if (userService) {
      userService.refreshSelf();
    }
  }, [userService]);

  useEffect(() => {
    beginPasswordless(phoneNumber);
  }, [phoneNumber]);

  if (!user) {
    return <Redirect to={PATHS.LOGIN} />;
  }
  if (user.isVerified) {
    return <Redirect to={PATHS.CONTACTS} />;
  }
  if (!phoneNumber) {
    return <Redirect to={PATHS.VERIFY_PHONE_NUMBER} />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(phoneNumber, code);
      await userService.refreshSelf();
    } catch (error) {
      if (!error.data || !error.data.message) {
        throw error;
      }
      const { message } = error.data;
      if (message === 'NOT_WHITELISTED') {
        setHasAllowlistError(true);
      } else if (message === 'BAD_OTP') {
        setHasBadOtpError(true);
      }
    }
  };
  let content;
  if (hasAllowlistError) {
    content = (
      <div>{STRINGS[locale].VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE}</div>
    );
  } else {
    content = (
      <form onSubmit={onSubmit} style={{ height: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <div>
            <Typography
              variant="h5"
              component="h1"
              color={hasBadOtpError ? 'error' : 'inherit'}
              style={{ marginBottom: '12px' }}
            >
              {hasBadOtpError
                ? STRINGS[locale].VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE
                : STRINGS[
                    locale
                  ].VERIFY_PHONE_NUMBER_VERIFICATION_TITLE.replace(
                    '{phoneNumber}',
                    phoneNumber
                  )}
            </Typography>
            <TextField
              fullWidth
              label={
                STRINGS[locale].VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL
              }
              value={code}
              onChange={(error) => setCode(error.target.value)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <RoundedButton
              style={{
                width: '30%',
              }}
              variant="contained"
              disableElevation
              onClick={() => {
                beginPasswordless(phoneNumber);
              }}
            >
              {STRINGS[locale].VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL}
            </RoundedButton>
            <PrimaryButton
              style={{
                width: '30%',
              }}
              variant="contained"
              disableElevation
              type="submit"
              value="submit"
            >
              {STRINGS[locale].VERIFY_PHONE_NUMBER_SUBMIT_LABEL}
            </PrimaryButton>
          </div>
        </div>
      </form>
    );
  }
  return <Container>{content}</Container>;
}
