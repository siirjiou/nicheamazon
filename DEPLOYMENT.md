# Deployment Guide for Amazon Niche Finder

## Prerequisites
- GitHub account
- Netlify account (free tier works)
- Git installed on your computer

## Steps to Deploy to Netlify via GitHub

### 1. Initialize Git Repository (if not already done)
\`\`\`bash
git init
git add .
git commit -m "Initial commit: Amazon Niche Finder with multi-country support"
\`\`\`

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "amazon-niche-finder")
3. Don't initialize with README (since you already have code)

### 3. Push to GitHub
\`\`\`bash
git remote add origin https://github.com/YOUR_USERNAME/amazon-niche-finder.git
git branch -M main
git push -u origin main
\`\`\`

### 4. Deploy to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your "amazon-niche-finder" repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### 5. Update Code and Redeploy
Whenever you make changes:
\`\`\`bash
git add .
git commit -m "Description of your changes"
git push origin main
\`\`\`

Netlify will automatically rebuild and deploy your site!

## How It Works

### Development Mode
- Uses Vite proxy at `/api/ox`
- Proxies to `sellercentral.amazon.fr` by default
- Runs on `localhost:3000`
- CSRF token and cookie passed via custom headers

### Production Mode (Netlify)
- Same proxy structure works in production
- Authentication handled via custom headers from the UI
- No environment variables needed for basic operation

## New Features

### Separate Country & Marketplace Selection
- **Country selector**: Changes the Amazon domain URL (e.g., amazon.fr, amazon.it)
- **Marketplace ID selector**: Changes the marketplace ID used in API queries
- These can be set independently for maximum flexibility

### Configurable Filters
Users can now customize all filter criteria:
- **Min Search Volume**: Minimum search volume over 360 days (default: 360,000)
- **Min Growth Ratio**: Minimum growth ratio (default: 0)
- **Min Units Sold**: Minimum units sold over 360 days (default: 1,000)
- **Min Price**: Minimum average price (default: 20)
- **Max Reviews**: Maximum average review count (default: 1,000)

### Direct Links to Niches
- Results table includes a "Link" column
- Each niche has a clickable link to view it on Amazon Seller Central
- Links automatically use the correct country domain

## Supported Countries
The app supports all countries in the MARKETPLACES array:
- 🇺🇸 US - United States (amazon.com)
- 🇫🇷 FR - France (amazon.fr)
- 🇮🇹 IT - Italy (amazon.it)
- 🇩🇪 DE - Germany (amazon.de)
- 🇪🇸 ES - Spain (amazon.es)
- 🇬🇧 UK - United Kingdom (amazon.co.uk)
- 🇮🇪 IE - Ireland (amazon.ie)
- 🇳🇱 NL - Netherlands (amazon.nl)
- 🇸🇪 SE - Sweden (amazon.se)
- 🇵🇱 PL - Poland (amazon.pl)
- 🇧🇪 BE - Belgium (amazon.com.be)
- 🇨🇦 CA - Canada (amazon.ca)
- 🇲🇽 MX - Mexico (amazon.com.mx)

## Testing
1. Select a country from the Country dropdown
2. Select a marketplace ID from the Marketplace ID dropdown
3. Adjust filters as needed
4. Enter your CSRF token and cookie from Seller Central
5. Add keywords (one per line) and start searching
6. Results will include direct links to view niches on Amazon Seller Central
