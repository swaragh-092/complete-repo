import { formatDistanceToNow } from 'date-fns';
import './RequestCard.css';

export default function RequestCard({ request, onApprove, onReject }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  const getFrameworkIcon = (framework) => {
    if (framework?.includes('React')) return '⚛️';
    if (framework?.includes('Vue')) return '💚';
    if (framework?.includes('Angular')) return '🔴';
    return '🔧';
  };

  return (
    <div className={`request-card ${request.status}`}>
      {/* Card Header */}
      <div className="card-header">
        <div className="app-info">
          <h3 className="app-name">{request.name}</h3>
          <div className="client-key">{request.client_key}</div>
        </div>
        <div className="status-badge">
          <span className="status-icon">{getStatusIcon(request.status)}</span>
          <span className="status-text">{request.status.toUpperCase()}</span>
        </div>
      </div>

      {/* Developer Info */}
      <div className="developer-info">
        <div className="developer-details">
          <div className="developer-name">
            👤 {request.developer_name || 'Unknown Developer'}
          </div>
          <div className="developer-email">
            📧 {request.developer_email || 'No email provided'}
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="technical-details">
        <div className="detail-row">
          <span className="detail-label">Framework:</span>
          <span className="detail-value">
            {getFrameworkIcon(request.metadata?.framework)} 
            {request.metadata?.framework || 'Not specified'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Redirect URL:</span>
          <span className="detail-value redirect-url">{request.redirect_url}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Purpose:</span>
          <span className="detail-value">{request.metadata?.purpose || 'Development'}</span>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <div className="description">
          <strong>Description:</strong>
          <p>{request.description}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="timestamps">
        <div className="timestamp">
          📅 Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
        </div>
        {request.approved_at && (
          <div className="timestamp">
            ✅ Approved {formatDistanceToNow(new Date(request.approved_at), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div className="rejection-reason">
          <strong>Rejection Reason:</strong>
          <p>{request.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="card-actions">
          <button 
            className="approve-btn"
            onClick={onApprove}
          >
            ✅ Approve
          </button>
          <button 
            className="reject-btn"
            onClick={onReject}
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
}
