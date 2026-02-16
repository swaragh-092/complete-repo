const Layout = require('./components/_layout');
const { InfoBox, KeyValue, Button } = require('./components/_components');

exports.highRiskLoginTemplate = (data) => {
  const content = `
    <p>We detected a <strong style="color: #d9534f;">HIGH RISK</strong> login attempt to your account.</p>

    ${InfoBox({
    title: 'Login Details',
    children: `
        ${KeyValue({ label: 'Device', value: data.deviceName })}
        ${KeyValue({ label: 'Location', value: data.location })}
        ${KeyValue({ label: 'Time', value: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }) })}
        ${KeyValue({ label: 'Risk Score', value: `${data.riskScore.score}/100` })}
        <div style="margin-top: 10px;">
            <strong>Risk Factors:</strong>
            <ul style="margin-top: 5px; padding-left: 20px;">
                ${Object.entries(data.riskScore.breakdown).map(([key, value]) => `<li>${key}: ${value} points</li>`).join('')}
            </ul>
        </div>
        `,
    style: 'danger'
  })}

    <p style="margin-top: 20px;"><strong style="color: #d9534f;">⚠️ URGENT: Was this you?</strong></p>
    <p>If you did NOT attempt this login, please secure your account immediately.</p>

    ${Button({
    url: `${process.env.FRONTEND_URL}/security/change-password`,
    text: 'Secure My Account',
    style: 'danger'
  })}
    `;

  return Layout({
    title: '⚠️ High-Risk Login Detected',
    content,
    appName: process.env.APP_NAME || 'Auth Service',
    previewText: 'High-risk login attempt blocked'
  });
};
