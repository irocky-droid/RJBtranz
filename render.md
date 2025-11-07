# RJB TRANZ Deployment Guide - Render

This guide provides step-by-step instructions for deploying the RJB TRANZ application to Render.

## Prerequisites

Before deploying to Render, ensure you have:

1. A Render account (sign up at [render.com](https://render.com))
2. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Supabase project set up with proper configuration
4. Environment variables prepared

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to Git**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Verify your build works locally**:
   ```bash
   npm run build
   ```

### Step 2: Create a New Web Service on Render

1. **Log in to Render** and click "New" → "Web Service"

2. **Connect your repository**:
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your RJB TRANZ repository
   - Click "Connect"

3. **Configure the service**:
   - **Name**: `rjb-tranz` (or your preferred name)
   - **Environment**: `Node` - This tells Render to use Node.js runtime for your application
   - **Build Command**: `npm run build` - This compiles your React/TypeScript application into production-ready static files
   - **Start Command**: `npm run preview` - This serves the built application in production mode using a lightweight server

### Step 3: Configure Environment Variables

Add the following environment variables in Render's dashboard:

#### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
VITE_APP_TITLE=RJB TRANZ
VITE_APP_VERSION=1.0.0

# Optional: Analytics and Monitoring
VITE_ANALYTICS_ID=your_analytics_id
```

### Step 4: Configure Build Settings

1. **Root Directory**: Leave empty (root of repository)
2. **Node Version**: `18` or `20` (latest LTS recommended)
3. **Health Check Path**: `/` (root path)

### Step 5: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** - this may take 5-15 minutes
3. **Monitor the build logs** for any errors

### Step 6: Post-Deployment Configuration

#### Database Setup

1. **Create Supabase tables** for user management and activity tracking:
   ```sql
   -- Users table for admin panel (enhanced with activity tracking)
   CREATE TABLE user_approvals (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
     last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     is_online BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- User activity tracking table
   CREATE TABLE user_activity (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
     last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     is_online BOOLEAN DEFAULT FALSE,
     session_id TEXT,
     ip_address INET,
     user_agent TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

   -- Create indexes for performance
   CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
   CREATE INDEX idx_user_activity_last_activity ON user_activity(last_activity DESC);
   CREATE INDEX idx_user_activity_is_online ON user_activity(is_online);
   ```

2. **Set up Supabase Auth hooks** for automatic user approval tracking and activity monitoring

#### Admin Setup

1. **Create the Super Admin user**:
   - Email: `admin@rjbtranz.com`
   - Password: `SuperAdmin2024!`
   - This is hardcoded in the application for initial setup

2. **Test the admin panel**:
   - Log in with admin credentials
   - Access System Settings → Admin Panel
   - Verify user management functionality
   - Check real-time user activity tracking ("active now", "last active X time ago")
   - Test user approval/denial workflow

### Step 7: Domain Configuration (Optional)

1. **Custom Domain**:
   - Go to your service settings
   - Add your custom domain
   - Configure DNS records as instructed

2. **SSL Certificate**: Automatically provided by Render

### Step 8: Monitoring and Maintenance

1. **Enable auto-deployment** from your Git repository
2. **Set up health checks** and monitoring
3. **Configure backup strategies** for your data
4. **Monitor usage and scale** as needed

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`
   - Check build logs for specific errors

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check variable names match exactly
   - Restart service after adding variables

3. **Database Connection**:
   - Verify Supabase URL and keys
   - Check database permissions
   - Ensure RLS policies are correct

4. **Static Assets**:
   - Verify `dist` folder is generated correctly
   - Check file paths in build output

### Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **RJB TRANZ Issues**: Check repository issues or contact maintainers

## Security Notes

- **Never commit secrets** to your repository
- **Use environment variables** for all sensitive data
- **Enable HTTPS** (automatically handled by Render)
- **Regularly update dependencies** for security patches
- **Monitor access logs** for suspicious activity

## Performance Optimization

- **Enable caching** headers for static assets
- **Use CDN** if needed for global distribution
- **Monitor response times** and optimize as needed
- **Scale vertically/horizontally** based on usage patterns

---

**Deployment URL**: Your app will be available at `https://your-service-name.onrender.com`

**Admin Access**: Use the Super Admin credentials to manage users and system settings.