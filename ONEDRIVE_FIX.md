# Fixing EBUSY Errors with OneDrive

## The Problem

The EBUSY (resource busy or locked) error occurs because:
1. Your project is in a OneDrive-synced folder
2. OneDrive locks files while syncing
3. Next.js development server tries to read locked files
4. Result: File access errors

## Solutions (In Order of Effectiveness)

### ✅ Solution 1: Move Project Out of OneDrive (RECOMMENDED)

This is the best solution as it completely eliminates the conflict.

```powershell
# Create a local dev directory
mkdir C:\Dev

# Move project
move "C:\Users\matth\OneDrive\Attachments\SciOlyOperations\sciolyteams-2" "C:\Dev\sciolyteams-2"

# Navigate to new location
cd C:\Dev\sciolyteams-2

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

### ✅ Solution 2: Exclude Directories from OneDrive Sync

If you must keep the project in OneDrive:

1. **Exclude `.next` directory:**
   - Right-click `.next` folder
   - Select "Free up space"
   - This keeps it local-only

2. **Exclude `node_modules`:**
   - Right-click `node_modules` folder
   - Select "Free up space"

3. **Exclude other build directories:**
   - `.vercel`
   - `out`
   - `build`

### ✅ Solution 3: Pause OneDrive Sync During Development

Temporary solution while coding:

1. Right-click OneDrive icon in system tray
2. Select "Pause syncing"
3. Choose duration (2 hours, 8 hours, or 24 hours)
4. Remember to resume when done

### ✅ Solution 4: Use WSL2 (Windows Subsystem for Linux)

For a more robust development environment:

```bash
# Install WSL2 (if not already installed)
wsl --install

# Clone/move project to WSL filesystem
cd ~
git clone <your-repo-url>
# or move project: cp -r /mnt/c/Users/matth/OneDrive/... ~/sciolyteams-2

# Install dependencies
cd sciolyteams-2
npm install

# Run dev server
npm run dev
```

Access at: http://localhost:3000

### 🔧 Solution 5: Optimize Next.js Config (Already Applied)

I've added:
- Request timeouts (10 seconds)
- Abort controllers for cancellable requests
- Debouncing to prevent rapid API calls
- Better error handling

These improvements are already in the code.

## Additional Recommendations

### 1. Restart Development Server

Sometimes the issue resolves with a simple restart:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 2. Clear Next.js Cache

```bash
# Stop the server
# Delete cache
rmdir /s /q .next
# Restart
npm run dev
```

### 3. Check for File Locks

```powershell
# Open Resource Monitor
resmon

# Go to CPU tab > Associated Handles
# Search for your project path
# Close any processes holding locks
```

### 4. Disable Antivirus Real-Time Scanning (Temporarily)

Some antivirus software locks files while scanning. Add your project directory to exclusions.

## Prevention Tips

1. **Always develop in local directories** (C:\Dev, C:\Projects, etc.)
2. **Use Git for backup**, not OneDrive
3. **Exclude build directories** from cloud sync
4. **Keep `node_modules` local-only**
5. **Use `.gitignore` properly** to avoid syncing unnecessary files

## Why This Happens

1. **OneDrive File Locking**:
   - OneDrive locks files during sync
   - Multiple processes compete for file access
   - Windows file system limitations

2. **Next.js Hot Reload**:
   - Watches files for changes
   - Recompiles on save
   - Needs quick file access

3. **Development Server**:
   - Frequently reads/writes files
   - Compiles TypeScript
   - Serves assets

These all conflict with OneDrive's sync mechanism.

## Quick Test

To verify the fix worked:

1. Navigate between tabs multiple times
2. Refresh the page repeatedly
3. Edit and save files while server is running
4. No more EBUSY errors = success! ✅

## Still Having Issues?

If problems persist:

1. Check Windows Event Viewer for file system errors
2. Run `chkdsk` to check disk health
3. Update OneDrive to latest version
4. Consider using Docker for development isolation
5. Switch to a different code editor (VSCode can cause locks with certain extensions)

## Long-Term Solution

**Use version control (Git) for backup, not cloud sync for active development projects.**

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin <your-repo-url>

# Commit and push regularly
git add .
git commit -m "Your changes"
git push
```

This way:
- ✅ Code is backed up
- ✅ No file locking issues
- ✅ Proper version history
- ✅ Team collaboration enabled

