# AI Chat Feature Setup

This document explains how to set up the AI Chat feature in the CoopWise application.

## Gemini API Key Setup

The AI Chat feature uses Google's Gemini 2.0 Flash model to provide financial advice and answer user questions. This model is optimized for fast responses while maintaining high quality. To make this feature work, you need to set up an API key:

1. Create a `.env.local` file in the root of the frontend directory if it doesn't already exist
2. Add the following line to the file:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

3. Replace `your_gemini_api_key_here` with your actual Gemini API key

## How to Get a Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click on "Get API key" in the top navigation
4. Create a new API key and copy it
5. Paste the API key in your `.env.local` file as shown above

## Development Notes

- The API key is accessed through environment variables and used centrally for all users
- In development mode, if the API key is missing, a warning will be logged to the console
- For production deployment, make sure to set the environment variable in your hosting platform (e.g., Vercel, Netlify)

## Model Configuration

The application uses the Gemini 2.0 Flash model with the following configuration:

```javascript
{
  model: 'gemini-2.0-flash',
  generationConfig: {
    maxOutputTokens: 800,
    temperature: 0.6,
  }
}
```

- **Model**: Gemini 2.0 Flash - Google's latest fast model optimized for quick responses
- **maxOutputTokens**: 800 - Allows for longer, more detailed responses
- **temperature**: 0.6 - Balanced between creativity and consistency

 