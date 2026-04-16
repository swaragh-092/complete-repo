// Author: Gururaj
// Created: 23rd May 2025
// Description: component for password field .
// Version: 1.0.0
// components/formFields/PasswordField.jsx
// Modified: 

import { useState } from "react";

import LockPersonIcon from '@mui/icons-material/LockPerson';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconButton } from "@mui/material";

import InputField from "./InputField";


export default function PasswordField({ errorMessage, validationName, label = 'Password', name = 'password' }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleShowButton = () => setShowPassword((prev) => !prev);

  return (
    <InputField
      type={showPassword ? 'text' : 'password'}
      name={name}
      label={label}
      iconTag={
          <IconButton onClick={handleShowButton} edge="end">
           {showPassword ?  <LockPersonIcon />:<VisibilityIcon />}
          </IconButton>
      }
      errorMessage={errorMessage}
      validationName={validationName}
      hideError={true}
       
    />
  );
}