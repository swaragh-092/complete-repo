import { useSnackbar } from 'notistack';

export const useToast = () => {
    const { enqueueSnackbar } = useSnackbar();

    const showSuccess = (message) => {
        enqueueSnackbar(message, { variant: 'success' });
    };

    const showError = (messageOrError, defaultPrefix = 'Operation failed') => {
        let msg = defaultPrefix;
        if (typeof messageOrError === 'string') {
            msg = messageOrError;
        } else if (messageOrError?.response?.data?.message) {
            msg = `${defaultPrefix}: ${messageOrError.response.data.message}`;
        } else if (messageOrError?.response?.data?.error) {
            msg = `${defaultPrefix}: ${messageOrError.response.data.error}`;
        } else if (messageOrError?.message) {
            msg = `${defaultPrefix}: ${messageOrError.message}`;
        }
        enqueueSnackbar(msg, { variant: 'error' });
    };

    const showWarning = (message) => {
        enqueueSnackbar(message, { variant: 'warning' });
    };

    const showInfo = (message) => {
        enqueueSnackbar(message, { variant: 'info' });
    }

    return { showSuccess, showError, showWarning, showInfo, enqueueSnackbar };
};
