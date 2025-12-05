# Vercel Deployment Guide

This guide will help you deploy the **Cool-Shot Systems AI Agent** frontend to Vercel.

## 📋 Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works great!)
- Your backend API deployed and accessible (e.g., Hugging Face Space, Railway, Render, etc.)
- Git repository connected to your Vercel account

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel](https://vercel.com) and sign in**

2. **Click "Add New Project"**

3. **Import your Git repository**
   - Select this repository: `Cool-Shot-Systems-AI-Agent`
   - Click "Import"

4. **Configure the project**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (the root `vercel.json` configures the frontend subdirectory)
   - **Build Command**: Will be auto-configured from `vercel.json`
   - **Output Directory**: Will be auto-configured from `vercel.json`
   
   **Note**: The repository includes a root-level `vercel.json` that automatically configures Vercel to build from the `frontend/` subdirectory. You don't need to manually set the root directory.

5. **Set Environment Variables**
   - Click "Environment Variables"
   - Add the following variable:
     ```
     Name: VITE_API_URL
     Value: https://your-backend-url.com
     ```
     *(Replace with your actual backend URL, e.g., `https://professorceo-coolshot-ai-backend.hf.space`)*

6. **Click "Deploy"**
   - Vercel will build and deploy your application
   - Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set environment variables** (after first deployment)
   ```bash
   vercel env add VITE_API_URL
   ```
   Then enter your backend URL when prompted.

6. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## 🔧 Configuration Details

### Environment Variables

The frontend requires the following environment variable:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | URL of your backend API | `https://professorceo-coolshot-ai-backend.hf.space` |

**Note**: If not set, the frontend will default to `https://professorceo-coolshot-ai-backend.hf.space`

### Local Development with Environment Variables

1. **Create `.env` file in the `frontend` directory**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `.env` and set your backend URL**
   ```
   VITE_API_URL=http://localhost:7860
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## 🌐 Backend Deployment Options

Your backend (Python FastAPI) can be deployed to various platforms:

### Option 1: Hugging Face Spaces (Current)
- **Free tier available**
- **GPU support**
- Already configured with `Dockerfile`
- URL: `https://your-username-space-name.hf.space`

### Option 2: Railway
1. Connect your GitHub repository
2. Select the root directory (contains `api.py`)
3. Railway will auto-detect Python and Dockerfile
4. Set environment variables if needed

### Option 3: Render
1. Create a new Web Service
2. Connect your repository
3. Use Docker deployment
4. Set port to `7860`

### Option 4: Google Cloud Run / AWS / Azure
- Containerized deployment using the provided `Dockerfile`
- Configure scaling and GPU support as needed

## 📝 Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed and accessible
- [ ] `VITE_API_URL` environment variable set in Vercel
- [ ] Test the Chat interface
- [ ] Test the Image Generator
- [ ] Check browser console for any errors
- [ ] Verify CORS is properly configured on backend

## 🔍 Troubleshooting

### Issue: "404 Not Found" on deployment
- **Solution 1**: Verify the root `vercel.json` file exists in the repository
  - The root-level `vercel.json` configures Vercel to build from the `frontend/` subdirectory
  - Ensure this file is committed to your repository
- **Solution 2**: Check that the build completed successfully in deployment logs
  - Go to Deployments tab and check the latest deployment logs
  - Look for "Build Completed" message
- **Solution 3**: Leave Root Directory empty in Vercel project settings
  - Go to Project Settings → General → Root Directory
  - It should be left empty (not set to `frontend`)
  - The `vercel.json` handles the directory configuration
- **Solution 4**: Redeploy the project
  - Go to Deployments tab
  - Click the three dots on the latest deployment
  - Select "Redeploy"

### Issue: "Failed to connect to backend"
- **Solution**: Verify your `VITE_API_URL` is correct and the backend is running
- Check browser console for CORS errors

### Issue: "Build failed"
- **Solution**: Ensure all dependencies are in `package.json`
- Check that the build command is `npm run build`
- Verify the output directory is set to `dist`

### Issue: "Page not found on refresh"
- **Solution**: The `vercel.json` configuration handles this with rewrites
- The root `vercel.json` has been updated to include these rewrites

### Issue: CORS errors
- **Solution**: Update your backend's CORS configuration to allow your Vercel domain:
  ```python
  allow_origins=["https://your-project.vercel.app"]
  ```

## 🎯 Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS

## 📊 Monitoring

- **Vercel Analytics**: Built-in analytics available in your Vercel dashboard
- **Build Logs**: Check deployment logs in Vercel for any build issues
- **Runtime Logs**: View function logs in the Vercel dashboard

## 🆘 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [FastAPI CORS Guide](https://fastapi.tiangolo.com/tutorial/cors/)

---

**Deployment Preview**

![Chat Interface](https://github.com/user-attachments/assets/64223b2e-2ae6-4c1c-8581-f2e04e930778)

Once deployed, your AI Assistant will be accessible worldwide with:
- ✨ Fast global CDN delivery
- 🔄 Automatic deployments on git push
- 🔒 Free SSL certificate
- 📈 Built-in analytics
