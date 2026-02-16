/**
 * Standard Email Footer
 */
module.exports = ({ appName, year }) => `
  <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 30px 20px; font-family: Helvetica, Arial, sans-serif;">
    <p style="margin: 0;">&copy; ${year || new Date().getFullYear()} ${appName || 'Your App'}. All rights reserved.</p>
    <div style="margin-top: 10px;">
      <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Help Center</a>
      <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
    </div>
    <p style="margin-top: 10px; opacity: 0.7;">
      You received this email because you have an account or requested an action on our platform.
    </p>
  </div>
`;
