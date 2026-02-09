/**
 * Reusable Email UI Components
 */

exports.Button = ({ url, text, style = 'primary' }) => {
    const colors = {
        primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        danger: '#ef4444',
        success: '#22c55e'
    };

    return `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; background: ${colors[style] || colors.primary}; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: Helvetica, Arial, sans-serif;">
          ${text}
        </a>
      </div>
    `;
};

exports.InfoBox = ({ title, children, style = 'info' }) => {
    const borders = {
        info: '#6366f1',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#22c55e'
    };

    return `
      <div style="background: white; padding: 20px; border-left: 4px solid ${borders[style]}; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        ${title ? `<h3 style="margin: 0 0 10px 0; color: #333;">${title}</h3>` : ''}
        <div style="color: #4b5563;">
          ${children}
        </div>
      </div>
    `;
};

exports.Divider = () => `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
  `;

exports.Badge = ({ text, color = '#e0e7ff', textColor = '#3730a3' }) => `
    <span style="display: inline-block; padding: 4px 12px; background: ${color}; color: ${textColor}; border-radius: 12px; font-weight: 600; font-size: 13px; margin-left: 8px;">
      ${text}
    </span>
  `;

exports.KeyValue = ({ label, value }) => `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
      <span style="color: #6b7280; font-weight: 500;">${label}</span>
      <span style="color: #111827; font-weight: 600; text-align: right;">${value}</span>
    </div>
  `;
