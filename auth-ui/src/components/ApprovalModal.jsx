import './Modal.css';

export default function ApprovalModal({ request, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal approval-modal">
        <div className="modal-header">
          <h2>✅ Approve Client Request</h2>
        </div>
        
        <div className="modal-content">
          <div className="approval-summary">
            <div className="summary-item">
              <strong>Application:</strong> {request.name}
            </div>
            <div className="summary-item">
              <strong>Client Key:</strong> {request.client_key}
            </div>
            <div className="summary-item">
              <strong>Developer:</strong> {request.developer_name} ({request.developer_email})
            </div>
            <div className="summary-item">
              <strong>Redirect URL:</strong> {request.redirect_url}
            </div>
          </div>

          <div className="approval-consequences">
            <h4>What happens when you approve:</h4>
            <ul>
              <li>✅ Client will be created in Keycloak</li>
              <li>📧 Developer will receive approval notification</li>
              <li>🔑 Client can immediately start using SSO</li>
              <li>🛡️ Client will have access to user authentication</li>
            </ul>
          </div>

          <div className="security-check">
            <div className="warning-box">
              ⚠️ <strong>Security Check:</strong> Ensure you trust this developer and the redirect URL is legitimate.
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn approve" onClick={onConfirm}>
            ✅ Approve Request
          </button>
        </div>
      </div>
    </div>
  );
}
