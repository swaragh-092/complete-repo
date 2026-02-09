const Header = require('./_header');
const Footer = require('./_footer');

/**
 * Main Email Layout
 * Wraps content with standardized Header and Footer within a responsive container.
 */
module.exports = ({ title, content, appName, previewText = '' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset & Basics */
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    
    /* Container */
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    
    /* Content */
    .content { padding: 30px; color: #374151; line-height: 1.6; font-size: 16px; }
    
    /* Utilities */
    strong { color: #111827; font-weight: 600; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  
  <!-- Preview Text (Hidden) -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>

  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 20px;">
          
          <div class="main">
            <!-- Header -->
            ${Header({ title, appName })}
            
            <!-- Content -->
            <div class="content">
              ${content}
            </div>
            
            <!-- Footer -->
            ${Footer({ appName })}
          </div>

        </td>
      </tr>
    </table>
  </div>

</body>
</html>
`;
