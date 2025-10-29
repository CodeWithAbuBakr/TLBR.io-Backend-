import juice from "juice";

export const getOtpHtml = ({ email, otp }) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>TLBR.io Verification Code</title>
<style>
body {
  margin: 0;
  padding: 0;
  background: #FAFAFA;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-text-size-adjust: 100%;
}
table { border-collapse: collapse; }
img { border: 0; display: block; max-width: 100%; height: auto; }

.wrapper {
  width: 100%;
  background: #FAFAFA;
  padding: 32px 0;
}
.container {
  width: 600px;
  max-width: 600px;
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #CCCCCC;
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
}
.header {
  background: #FFAB00;
  padding: 20px 24px;
  text-align: center;
}
.brand {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.3px;
  text-decoration: none;
}
.p-32 { padding: 32px; }
.title {
  font-size: 22px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}
.text {
  font-size: 15px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16px;
}
.otp {
  display: inline-block;
  background: #FAFAFA;
  border: 1px solid #CCCCCC;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 32px;
  letter-spacing: 10px;
  font-weight: 700;
  color: #333333;
  margin: 24px 0;
}
.muted {
  color: #999999;
  font-size: 14px;
  line-height: 1.6;
}
.footer {
  text-align: center;
  color: #999999;
  font-size: 12px;
  line-height: 1.6;
  padding: 16px 24px 24px 24px;
}
@media only screen and (max-width: 600px) {
  .container { width: 100% !important; }
  .p-32 { padding: 24px !important; }
  .otp { font-size: 26px !important; letter-spacing: 6px !important; }
}
</style>
</head>
<body>
<table class="wrapper" width="100%">
  <tr>
    <td align="center">
      <table class="container">
        <tr><td class="header"><span class="brand">TLBR.io</span></td></tr>
        <tr>
          <td class="p-32">
            <h1 class="title">Verify your email - ${email}</h1>
            <p class="text">Use the verification code below to complete your sign-in to TLBR.io.</p>
            <div align="center"><div class="otp">${otp}</div></div>
            <p class="muted">This code expires in <strong>5 minutes</strong>.</p>
            <p class="muted">If this wasn’t you, please ignore this email.</p>
          </td>
        </tr>
        <tr><td class="footer">© ${new Date().getFullYear()} TLBR.io. All rights reserved.</td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    return juice(html);
};


export const getVerifyEmailHtml = ({ email, token }) => {
    const appName = "TLBR.io";
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/token/${encodeURIComponent(token)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${appName} Verify Your Account</title>
<style>
body {
  margin: 0;
  padding: 0;
  background: #FAFAFA;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
table { border-collapse: collapse; }
.wrapper {
  width: 100%;
  background: #FAFAFA;
  padding: 32px 0;
}
.container {
  width: 600px;
  max-width: 600px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #CCCCCC;
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
  overflow: hidden;
}
.header {
  background: #FFAB00;
  padding: 20px 24px;
  text-align: center;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.brand {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 18px;
  text-decoration: none;
}
.p-32 {
  padding: 32px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}
.text {
  font-size: 15px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 20px;
}
.btn {
  display: inline-block;
  background: #FFAB00;
  color: #FFFFFF !important;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
}
.muted {
  color: #999999;
  font-size: 14px;
  line-height: 1.6;
}
.link {
  color: #333333;
  text-decoration: underline;
  word-break: break-all;
}
.footer {
  text-align: center;
  color: #999999;
  font-size: 12px;
  line-height: 1.6;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid #EEEEEE;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
@media only screen and (max-width: 600px) {
  .container { width: 100% !important; }
  .p-32 { padding: 24px !important; }
}
</style>
</head>
<body>
<table class="wrapper" width="100%">
<tr>
<td align="center">
  <table class="container">
    <tr>
      <td class="header">
        <span class="brand">${appName}</span>
      </td>
    </tr>
    <tr>
      <td class="p-32">
        <h1 class="title">Verify your account - ${email}</h1>
        <p class="text">Thanks for registering with ${appName}. Click below to verify your account.</p>
        <div align="center" style="margin: 24px 0;">
          <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener">Verify Account</a>
        </div>
        <p class="muted">If the button doesn’t work, copy and paste this link:</p>
        <p class="muted"><a class="link" href="${verifyUrl}" target="_blank" rel="noopener">${verifyUrl}</a></p>
        <p class="muted">If this wasn’t you, you can safely ignore this email.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</td>
    </tr>
  </table>
</td>
</tr>
</table>
</body>
</html>`;
    return juice(html);
};
