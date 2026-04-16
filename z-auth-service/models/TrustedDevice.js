const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrustedDevice = sequelize.define('TrustedDevice', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'user_metadata', key: 'id' },
      onDelete: 'CASCADE'
    },
    device_fingerprint: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique device identifier hash'
    },
    device_name: {
      type: DataTypes.STRING(100),
      defaultValue: 'Unknown Device'
    },
    device_type: {
      type: DataTypes.ENUM('mobile', 'desktop', 'tablet', 'unknown'),
      defaultValue: 'unknown'
    },
    browser: {
      type: DataTypes.STRING(50),
      comment: 'Browser name and version'
    },
    os: {
      type: DataTypes.STRING(50),
      comment: 'Operating system'
    },
    os_version: {
      type: DataTypes.STRING(50)
    },
    ip_address: {
      type: DataTypes.STRING(45),
      comment: 'IPv4 or IPv6 address'
    },
    location: {
      type: DataTypes.STRING(100),
      comment: 'City, Country (from IP geolocation)'
    },
    trust_status: {
      type: DataTypes.ENUM('pending', 'trusted', 'revoked', 'expired'),
      defaultValue: 'pending'
    },
    trusted_at: {
      type: DataTypes.DATE,
      comment: 'When device was marked as trusted'
    },
    expires_at: {
      type: DataTypes.DATE,
      comment: 'When device trust expires'
    },
    last_used: {
      type: DataTypes.DATE,
      comment: 'Last login timestamp'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional device information'
    }
  }, {
    tableName: 'trusted_devices',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['device_fingerprint'] },
      { fields: ['trust_status'] },
      { fields: ['user_id', 'device_fingerprint'], unique: true }
    ]
  });

  return TrustedDevice;
};
