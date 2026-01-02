# Office Decor Assistant

AI-powered web app to visualize decoration and layout ideas for your office space.

## Features

- Upload photos of your office
- Describe changes you want to see (wall colors, décor, furniture, etc.)
- Generate AI variations of your space
- Iteratively refine by selecting generated images as new base images

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```

3. Add your OpenRouter API key to `.env.local`
   - Get your API key at https://openrouter.ai/settings/keys

4. Run development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Upload a photo of your office
2. Enter a prompt describing desired changes (e.g., "Add a minimalist wooden shelf with plants", "Change wall color to sage green")
3. Click "Generate Variations"
4. Review generated options - click any to use as a new base image for further iterations
