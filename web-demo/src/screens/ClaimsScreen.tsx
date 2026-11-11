import { Fragment, useRef, useState } from 'react';
import { IoCameraOutline, IoDocumentTextOutline, IoLockClosedOutline, IoRefreshOutline, IoSparklesOutline } from 'react-icons/io5';
import { showAlert } from '../components/dialogs';
import type { Navigation } from '../navigation';
import { compressImage } from '../services/image';
import * as store from '../services/store';

export default function ClaimsScreen({ navigation }: { navigation: Navigation }) {
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // launchCamera(): opens the camera on phones, a file picker on desktop
  const handleTakePhoto = () => fileInput.current?.click();

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhotoUri(await compressImage(file));
    } catch {
      showAlert('Error', 'That photo could not be read. Please try another one.');
    }
  };

  const handleSubmitClaim = () => {
    if (!photoUri || !description) {
      showAlert('Error', 'Please provide both a description and a photo. Thank you.');
      return;
    }

    const isConnected = store.isConnected();
    const claimId = store.newClaimId();

    if (isConnected) {
      showAlert('Claim submitted', 'Your claim has been successfully uploaded.');
    } else {
      showAlert(
        'Offline mode',
        'No Internet connection. Your claim is securely saved to your device and will sync automatically when you regain connection',
      );
    }

    navigation.goBack();

    // Runs in the background, exactly like processClaimInBackground() in the app
    const uri = photoUri;
    const text = description;
    setDescription('');
    setPhotoUri(null);
    void (async () => {
      let cloudPhotoURL = store.OFFLINE_SENTINEL;

      if (isConnected) {
        try {
          cloudPhotoURL = await store.uploadFile(uri, claimId);
        } catch {
          store.enqueueImage(claimId, uri);
        }
      } else {
        store.enqueueImage(claimId, uri);
      }

      // Firestore keeps this in its local cache when offline and syncs it later
      store.setClaim({
        id: claimId,
        description: text,
        photoUrl: cloudPhotoURL,
        photoPreview: uri,
        status: 'pending',
        createdAt: Date.now(),
      });
    })();
  };

  const incomplete = !photoUri || !description;

  return (
    <div className="screen">
      <div className="scroll claims-content">
        <div className="claims-header">
          <button type="button" className="back-button" aria-label="Back" onClick={() => navigation.goBack()}>‹</button>
          <h1>File a Claim</h1>
          <div style={{ width: 36 }} />
        </div>

        <div className="step-row">
          {['Describe', 'Photo', 'Submit'].map((label, i) => (
            <Fragment key={label}>
              <div className="step-item">
                <div className={`step-dot ${i === 0 ? 'active' : ''}`}>{i + 1}</div>
                <div className={`step-label ${i === 0 ? 'active' : ''}`}>{label}</div>
              </div>
              {i < 2 && <div className="step-connector" />}
            </Fragment>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <IoDocumentTextOutline size={20} color="#00B4B6" />
            <h2>Describe the Incident</h2>
          </div>
          <textarea
            className="text-area"
            placeholder="What happened? Include location, time, and any other relevant details…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <IoCameraOutline size={20} color="#00B4B6" />
            <h2>Attach Evidence Photo</h2>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(event) => {
              void onFileChosen(event.target.files?.[0]);
              event.target.value = '';
            }}
          />

          {photoUri ? (
            <div className="photo-preview">
              <img src={photoUri} alt="Evidence preview" />
              <button type="button" className="retake" onClick={handleTakePhoto}>
                <IoRefreshOutline size={14} />
                <span>Retake</span>
              </button>
            </div>
          ) : (
            <button type="button" className="photo-placeholder" onClick={handleTakePhoto}>
              <IoCameraOutline size={36} color="#00B4B6" />
              <strong>Tap to take a photo</strong>
              <span>Clear photos speed up claim processing</span>
            </button>
          )}
        </div>

        <button type="button" className="advocate-button" onClick={() => navigation.navigate('Advocate')}>
          <div className="advocate-left">
            <div className="advocate-badge">
              <IoSparklesOutline size={24} color="#00B4B6" />
            </div>
            <div>
              <div className="advocate-title">Talk to AI Advocate</div>
              <div className="advocate-sub">Get guidance on your claim</div>
            </div>
          </div>
          <span className="advocate-arrow">›</span>
        </button>

        <button type="button" className={`submit-button ${incomplete ? 'disabled' : ''}`} onClick={handleSubmitClaim}>
          <span>Submit Claim</span>
          <span>→</span>
        </button>

        <div className="disclaimer">
          <IoLockClosedOutline size={13} color="#B0B0B0" />
          <span>Your data is end-to-end encrypted and will sync automatically when online.</span>
        </div>
      </div>
    </div>
  );
}
