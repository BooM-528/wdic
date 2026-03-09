export function getGuestId(): string {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem('x-guest-id');

  if (!guestId) {
    guestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : fallbackUUID();

    localStorage.setItem('x-guest-id', guestId);
  }

  return guestId;
}

function fallbackUUID() {
  // UUID v4-ish (ไม่ perfect แต่พอสำหรับ guest)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
