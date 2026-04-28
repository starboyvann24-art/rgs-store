const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public');

const replacementHtml = `
<div class="nav-right-section" style="display: flex; align-items: center; gap: 15px;">
    <a href="/api/auth/discord" style="background: #5865F2 !important; color: white !important; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(88,101,242,0.4); z-index: 9999;">
        <i class="fab fa-discord"></i> Login Discord
    </a>
</div>
`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regular expressions to find the auth container
    // Matches <div id="nav-auth-container"></div>
    // Matches <div class="auth-container"...>...</div>
    // Note: this is a bit tricky with regex for nested tags, let's just do a specific replace.
    
    // 1. <div id="nav-auth-container"></div>
    content = content.replace(/<div\s+id="nav-auth-container"[^>]*>.*?<\/div>/gs, replacementHtml.trim());
    content = content.replace(/<div\s+id="auth-nav-container"[^>]*>.*?<\/div>/gs, replacementHtml.trim());
    
    // 2. <div class="auth-container"...>...</div>
    // we need to be careful with nested divs.
    // In our files it usually contains an a tag.
    content = content.replace(/<div\s+class="auth-container[^>]*>.*?<\/div>/gs, replacementHtml.trim());
    
    // Dashboard.html has:
    // <div class="flex items-center gap-4">
    //   <span id="user-greeting"...
    //   <button data-action="logout"...
    // </div>
    // But the prompt says "HAPUS semua ID seperti id="auth-nav-container" atau id="login-btn". MASUKKAN KODE HTML INI LANGSUNG".
    // I will replace auth-container and nav-auth-container first.

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
}

function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            processFile(fullPath);
        }
    });
}

traverseDir(directoryPath);
