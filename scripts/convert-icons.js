import { promises as fs } from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];
const iconDir = join(__dirname, '../public/icons');

async function convertIcons() {
  try {
    // Ensure the icons directory exists
    await fs.mkdir(iconDir, { recursive: true });

    // Convert each size
    for (const size of sizes) {
      const svgPath = join(iconDir, `icon${size}.svg`);
      const pngPath = join(iconDir, `icon${size}.png`);
      
      // Read the SVG file
      const svgBuffer = await fs.readFile(svgPath);
      
      // Convert to PNG
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`Converted icon${size}.svg to PNG`);
    }
    
    console.log('All icons converted successfully!');
  } catch (error) {
    console.error('Error converting icons:', error);
    process.exit(1);
  }
}

convertIcons(); 