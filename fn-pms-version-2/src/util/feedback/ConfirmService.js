// Author: Gururaj
// Created: 21th May 2025
// Description: This is the code to initialize the confirm box.
// Version: 1.0.0
// utils/ConfirmService.js
// Modified: 


let confirmHandler = null;

// store the confirm box handler function in confirmHandler from confirm box component
export const setConfirmHandler = (handler) => {
  confirmHandler = handler;
};

// call when we open we want to show the confirm box
export const showConfirmDialog = ({ title, message, onConfirm }) => {
  if (confirmHandler) {
    confirmHandler({ title, message, onConfirm });
  } else {
    console.warn("Confirm handler not initialized yet");
  }
};
