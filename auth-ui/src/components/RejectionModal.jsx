import { useState } from 'react';
import { useSnackbar } from 'notistack';
import './Modal.css';

export default function RejectionModal({ request, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const rejectionTemplates = [
    {
      id: 'security',
      label: 'Security Concerns',
      template: 'The request has been rejected due to security concerns with the provided redirect URL or application configuration.'
    },
    {
      id: 'incomplete',
      label: 'Incomplete Information',
      template: 'The request lacks sufficient information. Please provide more details about the application purpose and implementation.'
    },
    {
      id: 'policy',
      label: 'Policy Violation',
      template: 'The request violates our client registration policies. Please review the guidelines and resubmit.'
    },
    {
      id: 'duplicate',
      label: 'Duplicate Request',
      template: 'A similar application or client key already exists. Please use a unique identifier.'
    },
    {
      id: 'custom',
      label: 'Custom Reason',
      template: ''
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setReason(template.template);
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      enqueueSnackbar('Please provide a reason for rejection', { variant: 'warning' });
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="modal-overlay">
      <div className="modal rejection-modal">
        <div className="modal-header">
          <h2>❌ Reject Client Request</h2>
        </div>
        
        <div className="modal-content">
          <div className="rejection-summary">
            <div className="summary-item">
              <strong>Application:</strong> {request.name}
            </div>
            <div className="summary-item">
              <strong>Developer:</strong> {request.developer_name} ({request.developer_email})
            </div>
          </div>

          <div className="rejection-templates">
            <h4>Select rejection reason:</h4>
            <div className="template-buttons">
              {rejectionTemplates.map(template => (
                <button
                  key={template.id}
                  className={`template-btn ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="reason-input">
            <label htmlFor="rejection-reason">
              <strong>Rejection Reason:</strong>
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear reason for rejecting this request..."
              rows={4}
              required
            />
            <div className="char-count">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="rejection-consequences">
            <h4>What happens when you reject:</h4>
            <ul>
              <li>📧 Developer will receive rejection notification with reason</li>
              <li>🚫 Client request will be marked as rejected</li>
              <li>🔄 Developer can submit a new request with corrections</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="confirm-btn reject" 
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            ❌ Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}
