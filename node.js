const _pick = require('lodash/pick');
const _get = require('lodash/get');

const User = require('../models').User;
const sendmail = require('../services/mail');

const env = process.env.NODE_ENV || 'development';

module.exports = {
  async resetPassword(ctx, next) {
    try {
      const { email } = _pick(ctx.request.body, ['email']);
      const user = await User.createResetPasswordToken(email);

      if (!email) {
        ctx.throw(400, 'Invalid request data');
      }

      // create and send confirmation token
      const confirmLink = `${ctx.protocol}://${ctx.host}/api/password/verify?token=${user.resetPasswordToken}`;

      if (env === 'production') {
        sendmail('Confirm password reseting', confirmLink, email);
      }

      if (env === 'development') {
        console.log(confirmLink);
      }

      ctx.body = {
        message: 'Waiting password for reset',
      };
    }
    catch(e) {
      ctx.throw(e.status, e.message);
    }
  },
  async resetPasswordVerify(ctx, next) {
    try {
      const resetToken = _get(ctx, 'query.token');
      const user = await User.getUserByResetPasswordToken(resetToken);

      if (!user || !resetToken) {
        ctx.redirect('/reset/password/failed');
        return;
      }

      const expired = Date.now() > user.resetPasswordExpires;
      if (expired) {
        ctx.redirect('/reset/password/expired');
        return;
      }

      ctx.cookies.set('resetPasswordToken', resetToken, { httpOnly: true });
      ctx.redirect('/reset/password/set');
    }
    catch(e) {
      ctx.throw(e.status, e.message);
    }
  },
  async changePassword(ctx, next) {
    try {
      const userId = ctx.state.user.id;
      const { oldPassword, newPassword } = _pick(ctx.request.body, ['newPassword', 'oldPassword']);
      if (!oldPassword || !newPassword) {
        ctx.throw(400, 'Invalid request data');
      }

      await User.changePassword(userId, oldPassword, newPassword);

      ctx.body = {
        message: 'Successfully saved'
      };
    }
    catch(e) {
      ctx.throw(e.status, e.message);
    }
  },
  async setNewPassword(ctx, next) {
    try {
      const { newPassword } = _pick(ctx.request.body, ['newPassword']);
      const resetPasswordToken = ctx.cookie['resetPasswordToken'];

      if (!newPassword || !resetPasswordToken) {
        ctx.throw(400, 'Invalid request data');
      }

      const user = await User.getUserByResetPasswordToken(resetPasswordToken);

      if (!user || !user.resetPasswordToken) {
        ctx.redirect('/reset/password/failed');
        return;
      }

      const expired = Date.now() > user.resetPasswordExpires;

      if (expired) {
        ctx.redirect('/reset/password/expired');
        return;
      }

      await User.resetPassword(user.id, newPassword);

      ctx.cookies.set('authtoken', '', { httpOnly: true, expires: new Date(1) });

      ctx.redirect('/reset/password/success');
    }
    catch(e) {
      ctx.throw(e.status, e.message);
    }
  }
};
