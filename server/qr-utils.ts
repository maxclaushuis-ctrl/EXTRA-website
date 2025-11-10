import QRCode from 'qrcode';
import { createHash, randomBytes } from 'crypto';

export interface QRCodeData {
  discountId: number;
  code: string;
  timestamp: number;
}

/**
 * Genereer een unieke QR-code voor een discount
 * @param discountId Het ID van de discount
 * @param discountName De naam van de discount voor in de QR-data
 * @returns Een promise met de QR-code als data URL
 */
export async function generateDiscountQR(
  discountId: number,
  discountName: string
): Promise<{ qrCode: string; code: string }> {
  // Genereer een unieke code voor deze QR
  const uniqueCode = randomBytes(16).toString('hex');
  
  // Hash voor extra veiligheid
  const secureCode = createHash('sha256')
    .update(`${discountId}-${uniqueCode}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
  
  // Data die in de QR-code wordt opgeslagen
  const qrData: QRCodeData = {
    discountId,
    code: secureCode,
    timestamp: Date.now()
  };
  
  // Converteer naar JSON string voor in de QR
  const qrContent = JSON.stringify(qrData);
  
  try {
    // Genereer QR-code als data URL (PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      qrCode: qrCodeDataUrl,
      code: secureCode
    };
  } catch (error) {
    console.error('Fout bij genereren QR-code:', error);
    throw new Error('Kon QR-code niet genereren');
  }
}

/**
 * Valideer of een QR-code geldig is
 * @param qrData De data uit de gescande QR-code
 * @returns Boolean die aangeeft of de QR-code geldig is
 */
export function validateQRCode(qrData: QRCodeData): boolean {
  // Check of de QR niet te oud is (bijvoorbeeld max 1 jaar geldig)
  const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 jaar in milliseconden
  const age = Date.now() - qrData.timestamp;
  
  if (age > maxAge) {
    console.log('QR-code verlopen');
    return false;
  }
  
  // Check of alle vereiste velden aanwezig zijn
  if (!qrData.discountId || !qrData.code || !qrData.timestamp) {
    console.log('QR-code mist vereiste velden');
    return false;
  }
  
  return true;
}

/**
 * Parse QR-code data uit een gescande string
 * @param qrString De gescande QR-code string
 * @returns De geparsede QR-code data of null bij fout
 */
export function parseQRCode(qrString: string): QRCodeData | null {
  try {
    const qrData = JSON.parse(qrString) as QRCodeData;
    
    if (validateQRCode(qrData)) {
      return qrData;
    }
    
    return null;
  } catch (error) {
    console.error('Fout bij parsen QR-code:', error);
    return null;
  }
}
