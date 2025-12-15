export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - adaptable, but maybe change to a Spanish one if preferred, will default here.
  // Using a multilingual model for better Spanish support if needed
  const MODEL_ID = 'eleven_multilingual_v2'; 

  if (!API_KEY) {
    throw new Error('ElevenLabs API Key not found in environment variables');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs API error: ${response.status} ${JSON.stringify(errorData)}`);
  }

  return await response.arrayBuffer();
};
