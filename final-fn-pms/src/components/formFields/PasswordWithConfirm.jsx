// Author: Gururaj
// Created: 26th May 2025
// Description: created for password field when it has both password and confirm password.
// Version: 1.0.0
// components/formFields/PasswordWithConfirm.jsx
// Modified: 

import { useState } from "react";

import InputField from "./InputField";
import Validator from "../../util/validation";

import { Stack } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import LockPersonIcon from '@mui/icons-material/LockPerson';
import VisibilityIcon from '@mui/icons-material/Visibility';

let confirmErrorMessage;

export default function PasswordWithConfirm({ errorMessage=null, confirmPasswordErrorMessagge = null, validationName = 'password'}) { 
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordValue, setPasswordValue] =  useState('');
    const [confirmPasswordValue, setConfirmPasswordValue] =  useState('');

    function handleChangePassword(value) {
        setPasswordValue(value);
        if (confirmPasswordValue !== '') {
            const errormessage = Validator('confirmPassword',confirmPasswordValue,  value);
            confirmErrorMessage = errormessage;
        }
    }

    function handleChangeConfirmPassword(value) {
        setConfirmPasswordValue(value);
        const errormessage = Validator('confirmPassword', value, passwordValue);
        confirmErrorMessage = errormessage;
    }
    
    const handleShowPassword = () => setShowPassword((prev) => !prev);
    const handleShowConfirmPassword = () => setShowConfirmPassword((prev) => !prev);
    return (<>
         <Stack spacing={2}>
        <InputField
            type={showPassword ? 'text' : 'password'}
            name="password"
            label='Password'
            iconTag={
            <IconButton onClick={handleShowPassword} edge="end">
                {showPassword ? <LockPersonIcon /> : <VisibilityIcon />}
            </IconButton>
            }
            errorMessage={errorMessage}
            validationName={validationName}
            value = {passwordValue}
            onChange={(e) => handleChangePassword(e.target.value)}
        />
        <InputField
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirm_password"
            label="Confirm Password"
            iconTag={
            <IconButton onClick={handleShowConfirmPassword} edge="end">
                {showConfirmPassword ? <LockPersonIcon /> : <VisibilityIcon />}
            </IconButton>
            }
            errorMessage={confirmPasswordErrorMessagge ?? confirmErrorMessage  ?? ""}
            validationName={validationName}
            value = {confirmPasswordValue}
            onChange={(e) => handleChangeConfirmPassword(e.target.value)}
        />
         </Stack>
        </>
    );
}    