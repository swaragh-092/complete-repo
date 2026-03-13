// Author: Gururaj
// Created: 21th May 2025
// Description: Alert message component .
// Version: 1.0.0
// components/feedback/ToastContainer.jsx
// Modified: gururaj at 23rd May 2025, added which comes one below another

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Snackbar, Alert, Slide } from "@mui/material";
import { setToastHandler } from "../../util/feedback/ToastService";

const DURATION = 4000;
const POSITION = { vertical: "top", horizontal: "right" };

let toastId = 0;

// Custom SlideUp transition — will apply only on exit (appear is false)
const SlideUp = (props) => {
  return <Slide {...props} direction="up" appear={false} />;
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastHandler(({ message, type = "info", duration = DURATION }) => {
      const id = toastId++;
      setToasts((prev) => [...prev, { id, message, type, duration, open: true }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    });
  }, []);

  const handleClose = (id, reason) => {
    if (reason === "clickaway") return;
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return ReactDOM.createPortal(
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          anchorOrigin={POSITION}
          TransitionComponent={SlideUp}
          style={{
            marginTop: index * 70,
            zIndex: 1400,
          }}
        >
          <Alert onClose={(e, reason) => handleClose(toast.id, reason)} severity={toast.type} variant="filled" sx={{ width: "100%", color: "#fff" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>,
    document.body
  );
};

export default ToastContainer;
