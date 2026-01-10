const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_DIR = './images';
const TEMPLATE_FILE = './template.html';
const OUTPUT_FILE = './anthology.html';

async function build() {
    console.log('--- Starting Anthology Build ---');
    
    // Safety check for template
    if (!fs.existsSync(TEMPLATE_FILE)) {
        console.error("Error: template.html not found!");
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    const folders = fs.readdirSync(IMAGE_DIR).filter(f => 
        fs.statSync(path.join(IMAGE_DIR, f)).isDirectory()
    ).sort().reverse(); 

    let htmlInjection = '';

    for (const [index, folder] of folders.entries()) {
        const folderPath = path.join(IMAGE_DIR, folder);
        const rawImages = fs.readdirSync(folderPath).filter(img => /\.(jpg|jpeg|png|webp|gif|heif|heic)$/i.test(img));

        if (rawImages.length === 0) continue;

        const processedImages = [];

        for (const img of rawImages) {
            const ext = path.extname(img).toLowerCase();
            let finalFileName = img;
            
            // HEIF Conversion Logic
            if (ext === '.heif' || ext === '.heic') {
                const newName = img.replace(/\.(heif|heic)$/i, '.webp');
                const inputPath = path.join(folderPath, img);
                const outputPath = path.join(folderPath, newName);

                if (!fs.existsSync(outputPath)) {
                    console.log(`Converting ${img} to WebP...`);
                    await sharp(inputPath).rotate().toFormat('webp').toFile(outputPath);
                }
                finalFileName = newName;
            }

            // Parsing: Date-Tag-Caption.webp
            // Example: 2026-Imaging-Neural Segmentation Result.webp
            const nameClean = finalFileName.replace(/\.[^/.]+$/, "");
            const parts = nameClean.split('-'); 
            
            processedImages.push({
                file: finalFileName,
                date: parts[0] || "2026",
                tag: parts[1] || "Research",
                caption: parts.slice(2).join(' ') || "Visual Analysis"
            });
        }

        // Gallery name from folder name
        const galleryTitle = folder.replace(/-/g, ' ').toUpperCase();
        const albumId = `album${index + 1}`;
        const itemClass = `item-${(index % 5) + 1}`;

        const imgTags = processedImages.map(data => 
            `<img src="images/${folder}/${data.file}" data-tag="${data.date} • ${data.tag}" data-cap="${data.caption}">`
        ).join('\n');

        htmlInjection += `
        <div class="album-trigger ${itemClass}" onclick="openCinema('${albumId}')">
            <img src="images/${folder}/${processedImages[0].file}">
            <div class="trigger-info">
                <span>PROJECT 0${index + 1}</span>
                <h3>${galleryTitle}</h3>
            </div>
            <div id="${albumId}-data" style="display:none;">
                <div class="imgs">${imgTags}</div>
            </div>
        </div>`;
    }

    // Replace the grid content in your template
    const result = template.replace(
        /<main class="archive-float">([\s\S]*?)<\/main>/,
        `<main class="archive-float">\n${htmlInjection}\n</main>`
    );

    fs.writeFileSync(OUTPUT_FILE, result);
    console.log(`Success: ${processedImages.length} images processed across ${folders.length} galleries.`);
}

build().catch(err => {
    console.error("Build failed:", err);
    process.exit(1);
});
