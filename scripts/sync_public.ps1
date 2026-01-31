# Sync Public Release Script
# Usage: .\scripts\sync_public.ps1
# This script squashes changes from 'main' (private) to 'public-release' (public)
# ensuring no history leaks.

$ErrorActionPreference = "Stop"

Write-Host "Starting Safe Sync Process..." -ForegroundColor Cyan

# 1. Check if we are on clean main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Error: You must be on 'main' branch to start." -ForegroundColor Red
    exit 1
}

$status = git status --porcelain
if ($status) {
    Write-Host "Error: Your working directory is not clean. Commit or stash changes first." -ForegroundColor Red
    exit 1
}

# 2. Switch to public-release
Write-Host "Switching to public-release..."
git checkout public-release

# 3. Pull latest main content (Squash Strategy)
# This command reads the tree of 'main' into current index/worktree
# practically 'making public-release look exactly like main'
Write-Host "Syncing files from main..."
git checkout main .

# 4. Clean up any untracked files that might be lingering
# (Optional, but good for safety to match main exactly)
# git clean -fd 

# 5. Check for changes
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to sync." -ForegroundColor Yellow
    git checkout main
    exit 0
}

# 6. Commit
Write-Host "Committing update..."
git commit -m "Update from private dev $(Get-Date -Format 'yyyy-MM-dd')"

# 7. Push (if remote exists)
$remotes = git remote
if ($remotes -contains "template") {
    Write-Host "Pushing to 'template' remote..."
    git push template public-release:main
}
else {
    Write-Host "Warning: 'template' remote not found. Skipping push." -ForegroundColor Yellow
    Write-Host "Run: git remote add template <URL>"
}

# 8. Return to main
git checkout main

# 9. Push Private to Origin
Write-Host "Pushing private changes to origin..."
git push origin main

Write-Host "Sync Complete! You are back on 'main'." -ForegroundColor Green
