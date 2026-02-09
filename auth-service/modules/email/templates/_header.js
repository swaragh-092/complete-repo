/**
 * Standard Email Header
 */
module.exports = ({ title, appName }) => `
  <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: Helvetica, Arial, sans-serif;">
      ${title}
    </h1>
    ${appName ? `<p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">${appName}</p>` : ''}
  </div>
`;
