// Author: Gururaj
// Created: 19th Jun 2025
// Description: Organisation switcher dropdown used in the sidebar or header.
// Version: 1.0.0
// Modified:

import { useState } from 'react';
import './OrganizationSwitcher.css';
import authConfig from '../../config/authConfig';

export default function OrganizationSwitcher({ organizations, currentOrg, onSwitch }) {
  const [isOpen, setIsOpen] = useState(false);

  // Check for single org mode
  const isSingleOrgMode = authConfig.organizationModel === 'single';

  if (isSingleOrgMode || !organizations || organizations.length <= 1) {
    return null; // Don't show switcher if user only has one org
  }

  return (
    <div className="org-switcher" onBlur={() => setIsOpen(false)} tabIndex={0}>
      <button 
        className="org-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="org-switcher-current">
          🏢 {currentOrg?.name || 'Select Organization'}
        </span>
        <span className="org-switcher-arrow">⌄</span>
      </button>

      {isOpen && (
        <div className="org-switcher-dropdown">
          {organizations.map((membership) => (
            <button
              key={membership.organization.id}
              className={`org-switcher-option ${
                currentOrg?.id === membership.organization.id ? 'active' : ''
              }`}
              onClick={() => {
                onSwitch(membership.organization.id);
                setIsOpen(false);
              }}
            >
              <div className="org-option-info">
                <div className="org-option-name">{membership.organization.name}</div>
                <div className="org-option-role">{membership.role?.name || 'Member'}</div>
              </div>
              {currentOrg?.id === membership.organization.id && (
                <span className="org-option-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}