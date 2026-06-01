type SendPayload = {
  lat: number;
  lon: number;
  tags?: Record<string, any>;
  message?: string;
  adf_id?: number;
};

export async function sendToTelegram(data: SendPayload): Promise<void> {
  try {
    const res = await fetch('/api/sendToTelegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error enviant el missatge: ${text}`);
    }
  } catch (err) {
    console.error('Error enviant a Telegram:', err);
    throw err;
  }
}
