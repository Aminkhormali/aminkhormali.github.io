const fs = require('fs');
const path = require('path');

const IMAGE_DIR = './images';
const TEMPLATE_FILE = './template.html';
const OUTPUT_FILE = './index.html';

function build() {
    console.log('Building Portfolio...');
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    
    // Scan folders
    const folders = fs.readdirSync(IMAGE_DIR).filter(f => 
        fs.statSync(path.join(IMAGE_DIR, f)).isDirectory()
    ).sort();

    let htmlInjection = '';

    folders.forEach((folder, index) => {
        const folderPath = path.join(IMAGE_DIR, folder);
        const images = fs.readdirSync(folderPath).filter(img => /\.(jpg|jpeg|png|webp)$/i.test(img));

        if (images.length === 0) return;

        const tag = folder.replace('-', ' | ');
        const title = folder.split('-').pop().toUpperCase();
        const albumId = `album${index + 1}`;
        const itemClass = `item-${(index % 5) + 1}`;

        // Create images for the 3D viewer
        const imgTags = images.map(img => 
            `<img src="images/${folder}/${img}" data-tag="${tag}" data-cap="Archive Entry: ${img.split('.')[0]}">`
        ).join('\n');

        htmlInjection += `
        <div class="album-trigger ${itemClass}" onclick="openCinema('${albumId}')">
            <img src="images/${folder}/${images[0]}">
            <div class="trigger-info"><span>ARCHIVE 0${index + 1}</span><h3>${title}</h3></div>
            <div id="${albumId}-data" style="display:none;">
                <div class="imgs">${imgTags}</div>
            </div>
        </div>`;
    });

    const result = template.replace(
        /([\s\S]*?)/,
        `\n${htmlInjection}\n`
    );

    fs.writeFileSync(OUTPUT_FILE, result);
    console.log('Successfully generated index.html');
}

// Initial Build
build();

// Watch for changes
fs.watch(IMAGE_DIR, { recursive: true }, (event, filename) => {
    if (filename) build();
});
