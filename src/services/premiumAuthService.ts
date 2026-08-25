import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface BoundDeviceRecord {
  browserId: string;
  boundAt: string;
  lastUsedAt: string;
}

export interface PremiumKeyRecord {
  key: string;
  fileName?: string;
  status: 'active' | 'blocked' | 'expired';
  browserId?: string;
  boundCount?: number;
  boundDevices?: (BoundDeviceRecord | string)[];
  createdAt?: Timestamp | any;
  boundAt?: Timestamp | any;
  lastUsedAt?: Timestamp | any;
  expiry?: string;
  latestGistLicenseLimit?: number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  licenseInfo?: {
    licenseLimit: number;
    boundCount: number;
  };
}

/**
 * Retrieves or generates a persistent device/browser identity from LocalStorage
 */
export function getBrowserId(): string {
  const STORAGE_KEY = 'browser_id';
  try {
    let browserId = localStorage.getItem(STORAGE_KEY);
    if (browserId && browserId.trim().length > 0) {
      return browserId.trim();
    }

    // Generate unique secure device token: BROWSER-XXXX-XXXX-XXXX
    const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const p3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    browserId = `BROWSER-${p1}-${p2}-${p3}`;

    localStorage.setItem(STORAGE_KEY, browserId);
    return browserId;
  } catch (e) {
    return 'BROWSER-DEFAULT-DEV';
  }
}

/**
 * Premium Key Authorization:
 * - GitHub Gist = SOURCE OF TRUTH for LicenseLimit and Expected Key.
 * - Cloud Firestore = Stores actual device bindings and administrator state (active/blocked/expired).
 * 
 * Flow:
 * 1. Checks matching key from live Gist.
 * 2. Connects to Cloud Firestore document `premium_keys/{KEY}`.
 * 3. Checks admin state (blocked / expired).
 * 4. Checks if current browser/device is already bound:
 *    - If already bound -> updates lastUsedAt and ALLOWS immediately without using a new slot.
 * 5. If new browser/device:
 *    - Compares current bindings against LIVE Gist LicenseLimit:
 *      * If count < Gist LicenseLimit -> binds new device and ALLOWS.
 *      * If count >= Gist LicenseLimit -> DENIES with exact message:
 *        "This premium key is already bounded to the maximum number of devices."
 */
export async function authorizePremiumKey(
  inputKey: string,
  gistExpectedKey?: string,
  liveGistLicenseLimit?: number,
  fileName?: string
): Promise<AuthResult> {
  const cleanInput = inputKey.trim().toUpperCase();
  const cleanExpected = (gistExpectedKey || '').trim().toUpperCase();
  const cleanFileName = (fileName || '').trim();

  // 1. Verify key input
  if (!cleanInput) {
    return { success: false, error: 'Please enter a valid premium activation key.' };
  }

  // Verify against live GitHub Gist key
  if (cleanExpected && cleanInput !== cleanExpected) {
    return { success: false, error: 'Invalid premium key.' };
  }

  // Extract effective live limit from Gist (defaults to 1 if not defined)
  const effectiveLimit =
    typeof liveGistLicenseLimit === 'number' && liveGistLicenseLimit > 0
      ? liveGistLicenseLimit
      : 1;

  try {
    const browserId = getBrowserId();
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'premium_keys', cleanInput);

    // Atomic transaction ensures safe concurrent device binding
    const result = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);

      // --- FIRST USE: Register new premium license in Firestore ---
      if (!snapshot.exists()) {
        const defaultExpiry = '2028-12-31 23:59:59';

        const initialDevice: BoundDeviceRecord = {
          browserId: browserId,
          boundAt: nowIso,
          lastUsedAt: nowIso,
        };

        const initialData: any = {
          key: cleanInput,
          status: 'active',
          browserId: browserId,
          boundCount: 1,
          boundDevices: [initialDevice],
          createdAt: serverTimestamp(),
          boundAt: serverTimestamp(),
          lastUsedAt: serverTimestamp(),
          expiry: defaultExpiry,
          latestGistLicenseLimit: effectiveLimit,
        };

        if (cleanFileName) {
          initialData.fileName = cleanFileName;
        }

        transaction.set(docRef, initialData);

        return { 
          success: true, 
          licenseInfo: { licenseLimit: effectiveLimit, boundCount: 1 } 
        };
      }

      // --- SUBSEQUENT USE: Multi-device License Validation against LIVE Gist limit ---
      const record = snapshot.data() as PremiumKeyRecord;

      // Check 1: Admin Blocked State
      if (record.status === 'blocked') {
        return {
          success: false,
          error: 'This premium key has been blocked by the administrator.',
        };
      }

      // Check 2: Expiry State
      if (record.status === 'expired') {
        return {
          success: false,
          error: 'This premium key has expired.',
        };
      }

      if (record.expiry) {
        const expiryDate = new Date(record.expiry).getTime();
        if (!isNaN(expiryDate) && expiryDate < Date.now()) {
          return {
            success: false,
            error: 'This premium key has expired.',
          };
        }
      }

      // Check 3: Active State
      if (record.status !== 'active') {
        return {
          success: false,
          error: 'This premium key is not active.',
        };
      }

      // Check 4: Device binding normalization
      let devicesList: BoundDeviceRecord[] = [];
      if (Array.isArray(record.boundDevices)) {
        devicesList = record.boundDevices.map((d) => {
          if (typeof d === 'string') {
            return { browserId: d, boundAt: nowIso, lastUsedAt: nowIso };
          }
          return d;
        });
      } else if (record.browserId) {
        devicesList = [
          {
            browserId: record.browserId,
            boundAt: nowIso,
            lastUsedAt: nowIso,
          },
        ];
      }

      // Check if current device is ALREADY bound to this key
      const existingDeviceIndex = devicesList.findIndex(
        (d) => d.browserId === browserId
      );

      if (existingDeviceIndex >= 0) {
        // Device is already bound! Refresh its lastUsedAt timestamp without consuming an extra slot
        const updatedDevices = [...devicesList];
        updatedDevices[existingDeviceIndex] = {
          ...updatedDevices[existingDeviceIndex],
          lastUsedAt: nowIso,
        };

        const updatePayload: any = {
          boundDevices: updatedDevices,
          boundCount: updatedDevices.length,
          lastUsedAt: serverTimestamp(),
          latestGistLicenseLimit: effectiveLimit,
        };

        if (cleanFileName) {
          updatePayload.fileName = cleanFileName;
        }

        transaction.update(docRef, updatePayload);

        return { 
          success: true, 
          licenseInfo: { licenseLimit: effectiveLimit, boundCount: updatedDevices.length } 
        };
      }

      // Device is NOT in the list — check against the LIVE GIST limit
      if (devicesList.length >= effectiveLimit) {
        return {
          success: false,
          error: 'This premium key is already bounded to the maximum number of devices.',
        };
      }

      // Slot is available under live Gist LicenseLimit: bind this new device
      const newDevice: BoundDeviceRecord = {
        browserId: browserId,
        boundAt: nowIso,
        lastUsedAt: nowIso,
      };

      const updatedDevices = [...devicesList, newDevice];

      const updatePayload: any = {
        boundDevices: updatedDevices,
        boundCount: updatedDevices.length,
        lastUsedAt: serverTimestamp(),
        latestGistLicenseLimit: effectiveLimit,
      };

      if (cleanFileName) {
        updatePayload.fileName = cleanFileName;
      }

      transaction.update(docRef, updatePayload);

      return { 
        success: true, 
        licenseInfo: { licenseLimit: effectiveLimit, boundCount: updatedDevices.length } 
      };
    });

    return result;
  } catch (err: any) {
    console.error('Firestore Authorization Error:', err);
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('permission-denied') || msg.includes('missing or insufficient permissions')) {
      return { 
        success: false, 
        error: 'Firestore Permission Notice: Please publish Security Rules for collection "premium_keys" in your Firebase Console (Rules tab).' 
      };
    }
    return { success: false, error: err?.message || 'Authorization failed. Please try again.' };
  }
}
