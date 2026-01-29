// account-ui/src/components/ClientCard.jsx
export default function ClientCard({ client, onLogin, isLoading }) {
  const cardStyle = {
    border: `2px solid ${client.primaryColor}`,
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    margin: '20px auto',
    textAlign: 'center',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const iconStyle = {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  };

  const titleStyle = {
    color: client.primaryColor,
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  const buttonStyle = {
    backgroundColor: client.primaryColor,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px',
    opacity: isLoading ? 0.7 : 1
  };

  return (
    <div style={cardStyle}>
      <span style={iconStyle}>{client.icon}</span>
      <h3 style={titleStyle}>{client.name}</h3>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        {client.description}
      </p>
      
      {/* Show which client is requesting access */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '12px', 
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>Requesting Access:</strong><br />
        {client.name}
      </div>

      <button 
        style={buttonStyle}
        onClick={onLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Redirecting...' : `Sign in with SSO`}
      </button>
    </div>
  );
}
