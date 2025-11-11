# AI Banner Generation Feature

## Overview
This feature uses Google's Gemini 2.0 Flash model to automatically generate unique, celebratory banner images for milestone notifications. Each banner is tailored to the specific milestone and platform.

## Setup

### 1. Install Google Generative AI Package
```bash
npm install @google/generative-ai
```

### 2. Get Google API Key
1. Visit: https://ai.google.dev/
2. Click "Get API key" 
3. Create a new API key in Google AI Studio
4. Copy your API key

### 3. Add to `.env.local`
```env
GOOGLE_API_KEY=your_api_key_here
```

### 4. Upload Reference Image
Place a reference image of ItzFesi in `/public/`:
- **Primary**: `/public/itzfesi-reference.png` (recommended)
- **Fallback**: `/public/main_banner.webp` (currently used)

The reference image should show ItzFesi's face clearly for the AI to learn from.

## API Endpoint

### POST `/api/generate-banner`

**Request Body:**
```json
{
  "milestone": "10,000",
  "platform": "YouTube",
  "customText": null
}
```

Or for custom messages:
```json
{
  "customText": "Thanks for 100K followers!",
  "platform": "Instagram",
  "milestone": null
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "message": "Banner generated successfully"
}
```

## Integration with Notifications

### In Admin Dashboard
The banner generation can be triggered:
1. **Manually** - Admin selects "Generate Banner" option
2. **Automatically** - On milestone detection

### Example Flow:
1. Milestone detected (e.g., 10K YouTube subscribers)
2. Call `/api/generate-banner` with milestone details
3. Gemini generates custom celebration image
4. Image saved to `/public/`
5. Image URL sent with notification to all subscribers

## How It Works

### Prompt Engineering
The system creates contextual prompts based on:
- **Milestone value**: "10,000 YouTube subscribers"
- **Platform**: YouTube, Telegram, or Instagram
- **Context**: Celebratory elements (confetti, stars, etc.)

Example prompt:
```
Create a celebratory banner image for ItzFesi reaching a milestone of 10,000 
YouTube subscribers. The image should feature ItzFesi's face prominently, 
celebratory elements like confetti, stars, and party decorations. Use vibrant 
colors, make it festive and exciting. Include the milestone number prominently. 
Make it suitable for Telegram notifications.
```

### Vision-Based Generation
- Gemini 2.0 Flash analyzes the reference image of ItzFesi
- Generates new unique images incorporating:
  - ItzFesi's likeness/style
  - Milestone information
  - Celebratory elements
  - Telegram-optimized dimensions

## Image Storage
- Generated banners returned as **base64 data URLs** (optimized for Vercel serverless)
- Format: `data:image/png;base64,{base64Data}`
- Stored in browser memory during admin session
- Can be delivered via:
  - Telegram photo messages (automatic conversion to binary)
  - Direct data URLs
  - No file system writes needed (Vercel compatible)

## Usage in Admin Dashboard

1. **Template Mode with Banner**:
   - Select "Use Template"
   - Choose platform
   - Enter milestone
   - Optional: Generate AI banner (future feature)
   - Click "Send Broadcast"

2. **Custom Message with Banner**:
   - Toggle off "Use Template"
   - Enter custom message
   - Generate or upload image
   - Click "Send Broadcast"

## Cost Considerations
- Google AI offers free tier: 15 requests per minute, 60 per day
- Gemini 2.0 Flash: ~0.075-0.3 USD per 1M input tokens
- Each image generation counts as 1 API request
- Consider caching/reusing images when possible

## Limitations
- First time setup requires reference image
- Gemini 2.0 Flash is currently the recommended model
- Image generation takes 5-30 seconds
- Must have valid Google API key with access to vision models

## Future Enhancements
- [ ] Integrate with template-based notifications
- [ ] Add image customization options (colors, themes)
- [ ] Batch generate banners for multiple milestones
- [ ] Cache generated images by milestone
- [ ] Add styling options in admin dashboard
- [ ] Support for different image templates

## Troubleshooting

**"Reference image not found"**
- Ensure `/public/itzfesi-reference.png` or `/public/main_banner.webp` exists
- Check file format (PNG or WebP supported)

**"GOOGLE_API_KEY not set"**
- Add `GOOGLE_API_KEY` to `.env.local`
- Verify key is valid and has vision API access

**"No image generated"**
- Check API quota hasn't been exceeded
- Verify API key has generative-ai permissions
- Check Gemini 2.0 Flash model availability

**Image quality issues**
- Update reference image for better results
- Try different milestone values
- Adjust prompt in code for specific styles
