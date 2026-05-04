<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8a9b638c-3afc-4581-b9b0-593f58858825

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## How it Works

Chronos uses **Practical Intelligence** to distill your goals. Unlike standard AI assistants, Chronos takes into account:
- **Time Constraints**: Scaling advice based on whether you have 5 minutes or 2 hours.
- **Priority Weight**: Adjusting the tone and directness based on the urgency of the task.
- **Focus Environments**: Providing a minimal, distraction-free "Focus Mode" for deep work sessions.
