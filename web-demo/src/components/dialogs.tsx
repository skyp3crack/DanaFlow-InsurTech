/** Web versions of React Native's Alert.alert and the react-native-biometrics prompt. */
import { useEffect, useState } from 'react';
import { IoFingerPrint } from 'react-icons/io5';

export interface AlertButton {
  text: string;
  onPress?: () => void;
}

interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface BiometricRequest {
  promptMessage: string;
  cancelButtonText: string;
  resolve: (success: boolean) => void;
}

let setAlert: (request: AlertRequest | null) => void = () => {};
let setBiometric: (request: BiometricRequest | null) => void = () => {};

/** Alert.alert(title, message?, buttons?) */
export function showAlert(title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) {
  setAlert({ title, message, buttons });
}

/** rnBiometrics.simplePrompt({ promptMessage, cancelButtonText }) -> { success } */
export function simplePrompt(promptMessage: string, cancelButtonText = 'Cancel'): Promise<boolean> {
  return new Promise((resolve) => setBiometric({ promptMessage, cancelButtonText, resolve }));
}

export function DialogHost() {
  const [alertRequest, setAlertRequest] = useState<AlertRequest | null>(null);
  const [biometricRequest, setBiometricRequest] = useState<BiometricRequest | null>(null);

  useEffect(() => {
    setAlert = setAlertRequest;
    setBiometric = setBiometricRequest;
    return () => {
      setAlert = () => {};
      setBiometric = () => {};
    };
  }, []);

  return (
    <>
      {alertRequest && (
        <div className="overlay" role="alertdialog" aria-modal="true" aria-label={alertRequest.title}>
          <div className="dialog">
            <h3>{alertRequest.title}</h3>
            {alertRequest.message && <p>{alertRequest.message}</p>}
            <div className="dialog-actions">
              {alertRequest.buttons.map((button) => (
                <button
                  key={button.text}
                  type="button"
                  onClick={() => {
                    setAlertRequest(null);
                    button.onPress?.();
                  }}
                >
                  {button.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {biometricRequest && (
        <div className="overlay bottom" role="dialog" aria-modal="true" aria-label="Biometric prompt">
          <div className="sheet">
            <div className="fingerprint">
              <IoFingerPrint size={44} />
            </div>
            <h3>{biometricRequest.promptMessage}</h3>
            <p>Touch the fingerprint sensor (simulated)</p>
            <div className="sheet-actions">
              <button
                type="button"
                className="cancel"
                onClick={() => {
                  biometricRequest.resolve(false);
                  setBiometricRequest(null);
                }}
              >
                {biometricRequest.cancelButtonText}
              </button>
              <button
                type="button"
                className="confirm"
                onClick={() => {
                  biometricRequest.resolve(true);
                  setBiometricRequest(null);
                }}
              >
                Use fingerprint
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
