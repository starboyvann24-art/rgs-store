const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public');

const oldReplacementHtml = `
<div class="nav-right-section" style="display: flex; align-items: center; gap: 15px;">
    <a href="/api/auth/discord" style="background: #5865F2 !important; color: white !important; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(88,101,242,0.4); z-index: 9999;">
        <i class="fab fa-discord"></i> Login Discord
    </a>
</div>
`.trim();

// The new HTML
const newReplacementHtml = `
  <a href="/api/auth/discord" style="background: #5865F2; color: white; padding: 10px 18px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
    <i class="fab fa-discord"></i> Login Discord
  </a>
`.trim();

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Instead of regex, let's just do a string replacement of the exact old block
    if (content.includes('nav-right-section') && content.includes('/api/auth/discord')) {
        // Regex to match the old block regardless of exact spacing
        const regex = /<div class="nav-right-section"[\s\S]*?<\/div>/;
        content = content.replace(regex, newReplacementHtml);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Processed: ${filePath}`);
    }
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
