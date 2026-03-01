/**
 * Scrape all product data from pizzalemon.ch
 * Extracts: name, price, description, image URL, sizes, category
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pizzalemon.ch/lemon/index.php';

// All categories found on the website
const CATEGORIES = [
  { name: 'Pizza', path: '20' },
  { name: 'Döner / Fingerfood', path: '90' },
  { name: 'Pide', path: '89' },
  { name: 'Tellergerichte', path: '101' },
  { name: 'Lahmacun', path: '119' },
  { name: 'Salat', path: '96' },
  { name: 'Dessert', path: '91' },
  { name: 'Softgetränke', path: '92' },
  { name: 'Alkoholische Getränke', path: '102' },
  { name: 'Bier', path: '120' },
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractProducts(html, categoryName) {
  const products = [];
  
  // Match product blocks - looking for product-layout divs
  // The site uses OpenCart, so product cards have a standard structure
  
  // Extract product links and names from category page
  const productPattern = /<div class="product-layout[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  const productBlocks = html.match(productPattern) || [];
  
  // Alternative: extract from the simpler structure
  // Look for product thumb containers
  const thumbPattern = /<div class="product-thumb[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  
  // Try to find product cards with image, name, price
  const imgPattern = /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/g;
  const pricePattern = /<span class="price-new">\s*([\d.,]+)\s*CHF/g;
  const priceOldPattern = /<p class="price">\s*([\d.,]+)\s*CHF/g;
  const priceAnyPattern = /(\d+[.,]\d{2})\s*CHF/g;
  const linkPattern = /href="([^"]*route=product\/product[^"]*)"/g;
  const nameFromH4 = /<h4[^>]*><a[^>]*>([^<]*)<\/a><\/h4>/g;
  
  // Extract all product links
  let match;
  const productLinks = [];
  const seenLinks = new Set();
  
  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, '&');
    if (!seenLinks.has(url)) {
      seenLinks.add(url);
      productLinks.push(url);
    }
  }

  // Extract product names from h4 tags
  const names = [];
  while ((match = nameFromH4.exec(html)) !== null) {
    names.push(match[1].trim());
  }

  // Extract images
  const images = [];
  const imgRegex = /<div class="image">[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>/g;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }

  // Extract prices  
  const prices = [];
  const priceBlockRegex = /<p class="price">([\s\S]*?)<\/p>/g;
  while ((match = priceBlockRegex.exec(html)) !== null) {
    const priceBlock = match[1];
    const priceMatch = priceBlock.match(/(\d+[.,]\d{2})\s*CHF/);
    if (priceMatch) {
      prices.push(priceMatch[1]);
    } else {
      prices.push('N/A');
    }
  }

  console.log(`  [${categoryName}] Found ${names.length} names, ${prices.length} prices, ${images.length} images, ${productLinks.length} links`);

  for (let i = 0; i < names.length; i++) {
    products.push({
      name: names[i],
      price: prices[i] || 'N/A',
      image: images[i] || '',
      link: productLinks[i] || '',
      category: categoryName,
    });
  }

  return { products, productLinks };
}

async function extractProductDetails(url) {
  try {
    const html = await fetchPage(url);
    const details = {};

    // Get product name
    const nameMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/);
    details.name = nameMatch ? nameMatch[1].trim() : '';

    // Get description
    const descMatch = html.match(/<div id="tab-description"[^>]*>([\s\S]*?)<\/div>/);
    if (descMatch) {
      details.description = descMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Get price
    const priceMatch = html.match(/(\d+[.,]\d{2})\s*CHF/);
    details.price = priceMatch ? priceMatch[1] : 'N/A';

    // Get image  
    const imgMatch = html.match(/<a[^>]*id="main-image"[^>]*href="([^"]*)"/);
    if (imgMatch) {
      details.fullImage = imgMatch[1];
    } else {
      const imgMatch2 = html.match(/<div class="thumbnails"[\s\S]*?<img[^>]*src="([^"]*)"/);
      if (imgMatch2) details.fullImage = imgMatch2[1];
    }

    // Get product image from og:image or product-image class
    const ogImgMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    if (ogImgMatch) details.fullImage = ogImgMatch[1];

    // Get size options
    const optionPattern = /<div id="product"[\s\S]*?<\/div>/;
    const sizePattern = /<input[^>]*value="([^"]*)"[^>]*>\s*<label[^>]*>([^<]*)</g;
    const radioPattern = /<label[^>]*for="[^"]*"[^>]*>([\s\S]*?)<\/label>/g;
    
    const sizes = [];
    let sizeMatch;
    
    // Look for radio buttons or select options for sizes
    const selectPattern = /<select[^>]*name="option\[[^\]]*\]"[^>]*>([\s\S]*?)<\/select>/g;
    let selectMatch;
    while ((selectMatch = selectPattern.exec(html)) !== null) {
      const optionRegex = /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g;
      let optMatch;
      while ((optMatch = optionRegex.exec(selectMatch[1])) !== null) {
        const optText = optMatch[2].trim();
        if (optText && optText !== '--- Bitte auswählen ---') {
          sizes.push(optText);
        }
      }
    }

    // Also look for radio button options
    const radioBlockPattern = /<div class="radio">\s*<label[^>]*>([\s\S]*?)<\/label>/g;
    while ((sizeMatch = radioBlockPattern.exec(html)) !== null) {
      const labelText = sizeMatch[1].replace(/<[^>]*>/g, '').trim();
      if (labelText) sizes.push(labelText);
    }

    details.sizes = sizes;
    
    return details;
  } catch (e) {
    console.error(`  Error fetching ${url}: ${e.message}`);
    return null;
  }
}

async function scrapeAll() {
  const allData = {};

  for (const cat of CATEGORIES) {
    console.log(`\nScraping category: ${cat.name} (path=${cat.path})...`);
    const url = `${BASE_URL}?route=product/category&path=${cat.path}`;
    
    try {
      const html = await fetchPage(url);
      const { products, productLinks } = extractProducts(html, cat.name);
      
      // Now fetch details for each product
      const detailedProducts = [];
      for (let i = 0; i < productLinks.length; i++) {
        const link = productLinks[i];
        if (!link) continue;
        
        const fullUrl = link.startsWith('http') ? link : `https://pizzalemon.ch${link}`;
        console.log(`  Fetching details for: ${products[i]?.name || 'Unknown'} ...`);
        
        const details = await extractProductDetails(fullUrl);
        if (details) {
          detailedProducts.push({
            ...products[i],
            ...details,
            link: fullUrl,
          });
        } else {
          detailedProducts.push(products[i] || { name: 'Unknown', category: cat.name });
        }
        
        // Small delay to not overload the server
        await new Promise(r => setTimeout(r, 300));
      }
      
      allData[cat.name] = detailedProducts.length > 0 ? detailedProducts : products;
      
    } catch (e) {
      console.error(`Error scraping ${cat.name}: ${e.message}`);
      allData[cat.name] = [];
    }
  }

  // Output the collected data
  const outputPath = path.join(__dirname, 'pizzalemon-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\n✅ Data saved to: ${outputPath}`);
  
  // Print summary
  console.log('\n====== SUMMARY ======');
  let total = 0;
  for (const [cat, products] of Object.entries(allData)) {
    console.log(`${cat}: ${products.length} products`);
    total += products.length;
  }
  console.log(`Total products: ${total}`);
}

scrapeAll().catch(console.error);
